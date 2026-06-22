/**
 * ============================================================
 * Label Preview Component
 * ============================================================
 *
 * Renders the selected nutrition label format with:
 *   - Format selector dropdown (US, EU, Indian, Canada, Australia)
 *   - Full Size zoom button → opens modal (1.6)
 *   - Download button → exports label as high-res PNG (1.4)
 *   - Nutrition analysis charts below the label (1.7)
 *   - Allergen detection panel (2.1) ← ADDED
 *   - Optional label information panel
 *
 * ADDED (2.1):
 *   - New optional prop: `ingredients?: RecipeIngredient[]`
 *   - `detectAllergens()` called with ingredients when provided
 *   - `<AllergenDisplay>` rendered below nutrition charts
 *   - Generator page: no ingredients → shows "use ingredient builder" prompt
 *   - Ingredient builder: passes ingredients → full allergen detection
 *
 * PRESERVED (1.7): Nutrition charts
 * PRESERVED (1.6): Label zoom modal
 * PRESERVED (1.4): Toast notifications, download loading state
 * PRESERVED (all): id="nutrition-label", all formats, 300 DPI export
 * ============================================================
 */

'use client';

import { LabelFormat } from '@/app/types/nutrition';
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
import { detectAllergens } from '@/app/lib/allergens';
import * as htmlToImage from 'html-to-image';
import { labelInfo } from '@/app/labelInfo';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface LabelPreviewProps {
  nutritionData: any;
  className?: string;
  showInfo?: boolean;
  compact?: boolean;
  showCharts?: boolean;
  /**
   * ingredients — ADDED (2.1)
   * Optional list of recipe ingredients used for allergen detection.
   * When provided: full allergen detection runs.
   * When omitted (generator page): "use ingredient builder" prompt shown.
   */
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── Allergen Detection ────────────────────────────────────────────────
  /**
   * Memoized so detection only re-runs when the ingredients array changes.
   * detectAllergens() is a pure function so this is safe.
   * Returns empty array when no ingredients provided.
   */
  const allergenResults = useMemo(
    () => detectAllergens(ingredients ?? []),
    [ingredients]
  );

  /**
   * hasIngredients flag passed to AllergenDisplay to distinguish between:
   *   - Generator page (no ingredient list) → show prompt
   *   - Ingredient builder (ingredient list exists) → run detection
   */
  const hasIngredients = Array.isArray(ingredients) && ingredients.length > 0;

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleFormatChange = (newFormat: LabelFormat) => {
    setFormat(newFormat);
    onFormatChange?.(newFormat);
  };

  /**
   * downloadLabel
   * Captures id="nutrition-label" as 300 DPI PNG.
   * Charts and allergen panel are outside the capture element.
   */
  const downloadLabel = async () => {
    const element = document.getElementById('nutrition-label');

    if (!element) {
      toast.error('Label element not found. Please try again.');
      return;
    }

    if (isDownloading) return;

    setIsDownloading(true);
    const loadingToastId = toast.loading('Generating high-resolution label…');

    try {
      const scaleFactor = 300 / 96;
      const width = element.offsetWidth * scaleFactor;
      const height = element.offsetHeight * scaleFactor;

      const dataUrl = await htmlToImage.toPng(element, {
        width,
        height,
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
      toast.success(`Label downloaded as ${filename}`);
    } catch (error) {
      toast.dismiss(loadingToastId);
      toast.error('Failed to generate label image. Please try again.');
      console.error('Label download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────
  const LabelComponent = labelComponents[format];

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className={cn('space-y-6', className)}>
      <Card className="p-2 border-none">

        {/* ── Toolbar ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">

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
                <DropdownMenuItem
                  key={key}
                  onClick={() => handleFormatChange(key)}
                >
                  {key} Format
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(true)}
              className="hover:text-primary-foreground"
              title="View full size"
            >
              <ZoomIn className="h-4 w-4 mr-2" />
              Full Size
            </Button>

            <Button
              onClick={downloadLabel}
              variant="outline"
              disabled={isDownloading}
              className="hover:text-primary-foreground min-w-[130px]"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </>
              )}
            </Button>
          </div>
        </div>

        {/*
          ── Label Render ─────────────────────────────────────────────
          id="nutrition-label" is on this element only.
          Everything below is excluded from PNG download.
        */}
        <div
          id="nutrition-label"
          className="flex justify-center bg-white rounded-lg"
        >
          {LabelComponent && <LabelComponent data={nutritionData} />}
        </div>

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
                  <h4 className="font-medium mb-2">Download Format</h4>
                  <p className="text-sm text-gray-500">PNG with transparent background</p>
                </Card>
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Resolution</h4>
                  <p className="text-sm text-gray-500">300 DPI for print-ready quality</p>
                </Card>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ── Nutrition Charts (1.7) ────────────────────────────────────── */}
      {showCharts && nutritionData && (
        <NutritionCharts data={nutritionData} />
      )}

      {/*
        ── Allergen Display (2.1) ────────────────────────────────────────
        Always rendered when nutritionData exists.
        AllergenDisplay handles its own empty/no-ingredient states internally.

        hasIngredients=false → generator page prompt
        hasIngredients=true  → full detection results
      */}
      {nutritionData && (
        <AllergenDisplay
          results={allergenResults}
          hasIngredients={hasIngredients}
        />
      )}

      {/* ── Label Zoom Modal (1.6) ────────────────────────────────────── */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>

          <Dialog.Overlay
            className={cn(
              'fixed inset-0 z-50 bg-black/70',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
            )}
          />

          <Dialog.Content
            className={cn(
              'fixed left-[50%] top-[50%] z-50',
              'translate-x-[-50%] translate-y-[-50%]',
              'w-[95vw] max-w-2xl max-h-[90vh]',
              'bg-white rounded-xl shadow-2xl',
              'flex flex-col',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2',
              'data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%]',
              'duration-200'
            )}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
              <div className="flex items-center gap-3">
                <Dialog.Title className="text-lg font-semibold">
                  Label Preview
                </Dialog.Title>
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
                      <DropdownMenuItem
                        key={key}
                        onClick={() => handleFormatChange(key)}
                      >
                        {key} Format
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadLabel}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
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
                <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">
                  Esc
                </kbd>{' '}
                or click outside to close
              </p>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
};

export default LabelPreview;
