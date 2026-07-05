/**
 * ============================================================
 * Label Preview Component
 * ============================================================
 *
 * ADDED (2.6): PDF Export
 *   - New "Export PDF" button in toolbar beside Download (PNG)
 *   - Uses generateLabelPdf() from app/lib/pdf-generator.ts
 *   - Captures id="nutrition-label" element (same as PNG)
 *   - Always exports original nutritionData (unaffected by slider)
 *   - Toast notifications for all PDF lifecycle events
 *   - Separate loading state from PNG download (both can coexist)
 *
 * PRESERVED (2.5): Serving size scaling slider
 * PRESERVED (2.2): Dietary tag display
 * PRESERVED (2.1): Allergen display
 * PRESERVED (1.7): Nutrition charts
 * PRESERVED (1.6): Label zoom modal
 * PRESERVED (1.4): Toast notifications, download loading state
 * PRESERVED (all): id="nutrition-label", all formats, 300 DPI PNG
 * ============================================================
 */

'use client';

import { LabelFormat, NutritionData } from '@/app/types/nutrition';
import { RecipeIngredient } from '@/app/types/recipe';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  Download,
  Globe,
  Loader2,
  ZoomIn,
  X,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import { USNutritionLabel } from '../us-nutrition-label';
import { EUNutritionLabel } from '../eu-nutrition-label';
import { IndianNutritionalLabel } from '../IndianNutritionalLabel';
import { CanadaNutritionLabel } from '../canada-nutrition-label';
import { AustraliaNutritionLabel } from '../australia-nutrition-label';
import { NutritionCharts } from './nutrition-charts';
import { AllergenDisplay } from './allergen-display';
import { DietaryTagDisplay } from './dietary-tag-display';
import { detectAllergens } from '@/app/lib/allergens';
import { detectDietaryTags } from '@/app/lib/dietary-tags';
import { generateLabelPdf } from '@/app/lib/pdf-generator';
import * as htmlToImage from 'html-to-image';
import { labelInfo } from '@/app/labelInfo';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ─────────────────────────────────────────────
// Constants (from 2.5)
// ─────────────────────────────────────────────

const SCALE_MIN = 0.25;
const SCALE_MAX = 3;
const SCALE_STEP = 0.25;

const NUTRIENT_SCALE_KEYS: (keyof NutritionData)[] = [
  'calories', 'totalFat', 'saturatedFat', 'transFat', 'cholesterol',
  'sodium', 'totalCarbohydrates', 'dietaryFiber', 'sugars', 'protein',
  'vitaminD', 'calcium', 'iron', 'potassium', 'servingSize',
];

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface LabelPreviewProps {
  nutritionData: any;
  className?: string;
  showInfo?: boolean;
  compact?: boolean;
  showCharts?: boolean;
  ingredients?: RecipeIngredient[];
  defaultFormat?: LabelFormat;
  onFormatChange?: (format: LabelFormat) => void;
}

// ─────────────────────────────────────────────
// Label Component Map
// ─────────────────────────────────────────────

const labelComponents: Record<LabelFormat, React.ComponentType<{ data: any }>> = {
  US: USNutritionLabel,
  EU: EUNutritionLabel,
  INDIAN: IndianNutritionalLabel,
  CANADA: CanadaNutritionLabel,
  AUSTRALIA: AustraliaNutritionLabel,
};

// ─────────────────────────────────────────────
// Scaling Utility (from 2.5)
// ─────────────────────────────────────────────

function scaleNutrition(data: NutritionData, scale: number): NutritionData {
  const scaled = { ...data };
  for (const key of NUTRIENT_SCALE_KEYS) {
    const value = data[key as keyof NutritionData];
    if (typeof value === 'number') {
      (scaled as any)[key] = Math.round(value * scale * 100) / 100;
    }
  }
  return scaled;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const LabelPreview = ({
  nutritionData,
  className,
  showInfo = true,
  compact = false,
  showCharts = true,
  ingredients,
  defaultFormat = 'US',
  onFormatChange,
}: LabelPreviewProps) => {

  // ── State ─────────────────────────────────────────────────────────────
  const [format, setFormat] = useState<LabelFormat>(defaultFormat);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scale, setScale] = useState(1.0);

  // ── Derived Values ────────────────────────────────────────────────────
  const scaledNutrition = useMemo(
    () => scaleNutrition(nutritionData, scale),
    [nutritionData, scale]
  );
  const isScaled = scale !== 1.0;
  const originalServingSize = Number(nutritionData?.servingSize) || 100;
  const currentServingSize = Math.round(originalServingSize * scale);

  const allergenResults = useMemo(
    () => detectAllergens(ingredients ?? []),
    [ingredients]
  );
  const dietaryTags = useMemo(
    () => detectDietaryTags(ingredients ?? []),
    [ingredients]
  );
  const hasIngredients = Array.isArray(ingredients) && ingredients.length > 0;

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleFormatChange = (newFormat: LabelFormat) => {
    setFormat(newFormat);
    onFormatChange?.(newFormat);
  };

  /**
   * downloadPng
   * Captures id="nutrition-label" at 300 DPI as PNG.
   * Always uses original nutritionData regardless of slider.
   */
  const downloadPng = async () => {
    const element = document.getElementById('nutrition-label');
    if (!element) { toast.error('Label element not found. Please try again.'); return; }
    if (isDownloading) return;

    setIsDownloading(true);
    const loadingToastId = toast.loading('Generating PNG label…');

    try {
      const scaleFactor = 300 / 96;
      const dataUrl = await htmlToImage.toPng(element, {
        width: element.offsetWidth * scaleFactor,
        height: element.offsetHeight * scaleFactor,
        style: {
          transform: `scale(${scaleFactor})`,
          transformOrigin: 'top left',
          width: `${element.offsetWidth}px`,
          height: `${element.offsetHeight}px`,
        },
        quality: 1.0,
      });

      const filename = `nutrition-label-${format.toLowerCase()}-${Date.now()}.png`;
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      toast.dismiss(loadingToastId);
      toast.success(`PNG downloaded: ${filename}`);
    } catch (error) {
      toast.dismiss(loadingToastId);
      toast.error('Failed to generate PNG. Please try again.');
      console.error('PNG download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * downloadPdf — ADDED (2.6)
   *
   * Captures id="nutrition-label" and generates a PDF.
   * Always uses original nutritionData (unaffected by slider).
   * Uses generateLabelPdf() from app/lib/pdf-generator.ts.
   *
   * Separate loading state from PNG so both buttons work independently.
   */
  const downloadPdf = async () => {
    const element = document.getElementById('nutrition-label');
    if (!element) { toast.error('Label element not found. Please try again.'); return; }
    if (isExportingPdf) return;

    setIsExportingPdf(true);
    const loadingToastId = toast.loading('Generating PDF label…');

    try {
      const filename = `nutrition-label-${format.toLowerCase()}-${Date.now()}`;
      const title = `Nutrition Label — ${format} Format`;

      const result = await generateLabelPdf({
        element,
        filename,
        title,
        scale: 2, // 192 DPI — good balance of quality vs file size
      });

      toast.dismiss(loadingToastId);

      if (result.success) {
        toast.success(`PDF downloaded: ${filename}.pdf`);
      } else {
        toast.error(`PDF generation failed: ${result.error}`);
      }
    } catch (error) {
      toast.dismiss(loadingToastId);
      toast.error('Failed to generate PDF. Please try again.');
      console.error('PDF export error:', error);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const LabelComponent = labelComponents[format];

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className={cn('space-y-6', className)}>
      <Card className="p-2 border-none">

        {/* ── Toolbar ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
          {/* Format selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 hover:text-primary-foreground">
                <Globe className="w-4 h-4" />
                {format} Format
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {(Object.keys(labelComponents) as LabelFormat[]).map((key) => (
                <DropdownMenuItem key={key} onClick={() => handleFormatChange(key)}>
                  {key} Format
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Full Size modal */}
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(true)}
              className="hover:text-primary-foreground"
              title="View full size"
            >
              <ZoomIn className="h-4 w-4 mr-2" />
              Full Size
            </Button>

            {/* PNG Download */}
            <Button
              onClick={downloadPng}
              variant="outline"
              disabled={isDownloading || isExportingPdf}
              className="hover:text-primary-foreground min-w-[110px]"
              title="Download as PNG (300 DPI)"
            >
              {isDownloading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />PNG…</>
              ) : (
                <><Download className="mr-2 h-4 w-4" />PNG</>
              )}
            </Button>

            {/*
              PDF Export Button — ADDED (2.6)
              Separate loading state from PNG.
              Uses FileText icon to distinguish from PNG download.
            */}
            <Button
              onClick={downloadPdf}
              variant="outline"
              disabled={isDownloading || isExportingPdf}
              className="hover:text-primary-foreground min-w-[110px]"
              title="Export as PDF (A4)"
            >
              {isExportingPdf ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />PDF…</>
              ) : (
                <><FileText className="mr-2 h-4 w-4" />PDF</>
              )}
            </Button>
          </div>
        </div>

        {/*
          ── Label Render ─────────────────────────────────────────────
          id="nutrition-label" — captured by BOTH PNG and PDF export.
          Always renders original nutritionData (not scaled).
        */}
        <div
          id="nutrition-label"
          className="flex justify-center bg-white rounded-lg"
        >
          {LabelComponent && <LabelComponent data={nutritionData} />}
        </div>

        {/* ── Serving Size Scaling Slider (2.5) ─────────────────────── */}
        {originalServingSize > 0 && (
          <div className="mt-6 pt-5 border-t">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Serving Size Preview</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Adjust to see how nutrients change per serving
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
                    isScaled
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600'
                  )}>
                    {currentServingSize}g
                    {isScaled && (
                      <span className="ml-1 text-blue-500">
                        ({scale > 1 ? '+' : ''}{Math.round((scale - 1) * 100)}%)
                      </span>
                    )}
                  </div>
                  {isScaled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setScale(1.0)}
                      className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-10 text-right flex-shrink-0">
                  {Math.round(originalServingSize * SCALE_MIN)}g
                </span>
                <input
                  type="range"
                  min={SCALE_MIN}
                  max={SCALE_MAX}
                  step={SCALE_STEP}
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  aria-label={`Serving size: ${currentServingSize}g`}
                />
                <span className="text-xs text-gray-400 w-10 flex-shrink-0">
                  {Math.round(originalServingSize * SCALE_MAX)}g
                </span>
              </div>

              <div className="flex justify-between px-10 text-xs text-gray-400">
                <span>¼×</span>
                <span>½×</span>
                <span className={cn('font-medium', !isScaled ? 'text-blue-500' : 'text-gray-400')}>
                  1× original
                </span>
                <span>2×</span>
                <span>3×</span>
              </div>

              {isScaled && (
                <div className="flex items-center justify-center gap-6 bg-blue-50 rounded-lg py-2.5 px-4 mt-1">
                  <div className="text-center">
                    <div className="text-lg font-black text-blue-700">
                      {Math.round(scaledNutrition.calories)}
                    </div>
                    <div className="text-xs text-blue-500">kcal</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-blue-600">
                      {scaledNutrition.protein.toFixed(1)}g
                    </div>
                    <div className="text-xs text-blue-400">protein</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-blue-600">
                      {scaledNutrition.totalFat.toFixed(1)}g
                    </div>
                    <div className="text-xs text-blue-400">fat</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-blue-600">
                      {scaledNutrition.totalCarbohydrates.toFixed(1)}g
                    </div>
                    <div className="text-xs text-blue-400">carbs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-blue-600">
                      {scaledNutrition.sodium.toFixed(0)}mg
                    </div>
                    <div className="text-xs text-blue-400">sodium</div>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-400 text-center">
                Preview only — downloaded PNG and PDF always reflect the original serving size.
              </p>
            </div>
          </div>
        )}

        {/* ── Label Info Panel ──────────────────────────────────────── */}
        {showInfo && (
          <div className="mt-6 pt-6 border-t">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">{labelInfo[format].title}</h2>
                <Badge variant="secondary">{format}</Badge>
              </div>
              <p className="text-gray-600">{labelInfo[format].description}</p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Export Formats</h4>
                  <p className="text-sm text-gray-500">PNG (300 DPI) · PDF (A4)</p>
                </Card>
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Resolution</h4>
                  <p className="text-sm text-gray-500">Print-ready quality</p>
                </Card>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ── Nutrition Charts (1.7) — receives scaledNutrition ────────── */}
      {showCharts && nutritionData && (
        <NutritionCharts data={scaledNutrition} />
      )}

      {/* ── Allergen Detection (2.1) ──────────────────────────────────── */}
      {nutritionData && (
        <AllergenDisplay results={allergenResults} hasIngredients={hasIngredients} />
      )}

      {/* ── Dietary Tag Detection (2.2) ───────────────────────────────── */}
      {nutritionData && (
        <DietaryTagDisplay tags={dietaryTags} hasIngredients={hasIngredients} />
      )}

      {/* ── Label Zoom Modal (1.6) ────────────────────────────────────── */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={cn(
            'fixed inset-0 z-50 bg-black/70',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )} />
          <Dialog.Content className={cn(
            'fixed left-[50%] top-[50%] z-50',
            'translate-x-[-50%] translate-y-[-50%]',
            'w-[95vw] max-w-2xl max-h-[90vh]',
            'bg-white rounded-xl shadow-2xl flex flex-col',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2',
            'data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%]',
            'duration-200'
          )}>
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
              <div className="flex items-center gap-3">
                <Dialog.Title className="text-lg font-semibold">Label Preview</Dialog.Title>
                <Badge variant="secondary">{format} Format</Badge>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Globe className="w-3.5 h-3.5" />
                      {format}
                      <ChevronDown className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {(Object.keys(labelComponents) as LabelFormat[]).map((key) => (
                      <DropdownMenuItem key={key} onClick={() => handleFormatChange(key)}>
                        {key} Format
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* PNG in modal */}
                <Button variant="outline" size="sm" onClick={downloadPng} disabled={isDownloading}>
                  {isDownloading
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Download className="h-3.5 w-3.5" />
                  }
                </Button>

                {/* PDF in modal */}
                <Button variant="outline" size="sm" onClick={downloadPdf} disabled={isExportingPdf}>
                  {isExportingPdf
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <FileText className="h-3.5 w-3.5" />
                  }
                </Button>

                <Dialog.Close asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </Dialog.Close>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="flex justify-center items-start p-8 bg-gray-50 min-h-full">
                {LabelComponent && (
                  <div className="shadow-lg rounded">
                    <LabelComponent data={nutritionData} />
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t bg-gray-50 rounded-b-xl flex-shrink-0">
              <p className="text-xs text-gray-500 text-center">
                Press{' '}
                <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">Esc</kbd>
                {' '}or click outside to close
              </p>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default LabelPreview;
