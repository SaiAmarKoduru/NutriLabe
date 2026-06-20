/**
 * ============================================================
 * Label Preview Component
 * ============================================================
 *
 * Renders the selected nutrition label format with:
 *   - Format selector dropdown (US, EU, Indian, Canada, Australia)
 *   - Download button (exports label as high-res PNG)
 *   - Optional label information panel
 *
 * ADDED (1.4): Toast notifications for download lifecycle
 *   - Loading toast while html-to-image is processing
 *   - Success toast when PNG download completes
 *   - Error toast if download fails (e.g. label element not found)
 *
 * ADDED (1.4): Download button shows spinner + "Generating…" text
 *   during image capture so users know the app is working.
 *
 * Existing functionality fully preserved:
 *   - All 5 label formats
 *   - Format switching
 *   - 300 DPI export with 3× scale factor
 *   - Label info panel
 * ============================================================
 */

'use client';

import { LabelFormat } from '@/app/types/nutrition';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Download, Globe, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { USNutritionLabel } from '../us-nutrition-label';
import { EUNutritionLabel } from '../eu-nutrition-label';
import { IndianNutritionalLabel } from '../IndianNutritionalLabel';
import { CanadaNutritionLabel } from '../canada-nutrition-label';
import { AustraliaNutritionLabel } from '../australia-nutrition-label';
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
  defaultFormat?: LabelFormat;
  onFormatChange?: (format: LabelFormat) => void;
}

// ─────────────────────────────────────────────
// Label Component Map
// ─────────────────────────────────────────────

/**
 * Maps each LabelFormat key to its corresponding React component.
 * Add new country formats here — the dropdown auto-populates from this map.
 */
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
  defaultFormat = 'US',
  onFormatChange,
}: LabelPreviewProps) => {
  const [format, setFormat] = useState<LabelFormat>(defaultFormat);
  const [isDownloading, setIsDownloading] = useState(false);

  /**
   * handleFormatChange
   * Updates local format state and notifies parent if callback provided.
   */
  const handleFormatChange = (newFormat: LabelFormat) => {
    setFormat(newFormat);
    onFormatChange?.(newFormat);
  };

  /**
   * downloadLabel
   *
   * Captures the #nutrition-label DOM element as a high-resolution PNG
   * and triggers a browser download.
   *
   * Resolution: 300 DPI achieved by scaling the element 3× (96 DPI × 3 = 288 DPI ≈ 300 DPI)
   *
   * ADDED (1.4):
   *   - Loading toast shown immediately when download starts
   *   - Success toast with filename when download completes
   *   - Error toast if anything fails (element missing, canvas error, etc.)
   *   - Button shows spinner + disabled state during generation
   */
  const downloadLabel = async () => {
    const element = document.getElementById('nutrition-label');

    if (!element) {
      toast.error('Label element not found. Please try again.');
      return;
    }

    if (isDownloading) return;

    setIsDownloading(true);

    // Show loading toast — persists until we dismiss it
    const loadingToastId = toast.loading('Generating high-resolution label…');

    try {
      const desiredDPI = 300;
      const scaleFactor = desiredDPI / 96;
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

      // Generate timestamped filename
      const filename = `nutrition-label-${format.toLowerCase()}-${Date.now()}.png`;

      // Trigger browser download
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      // Dismiss loading, show success
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

  const LabelComponent = labelComponents[format];

  return (
    <div className={cn('space-y-6', className)}>
      <Card className="p-2 border-none">

        {/* ── Toolbar: Format Selector + Download ───────────────────── */}
        <div className="flex items-center justify-between mb-6">

          {/* Format dropdown */}
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

          {/* Download button with loading state */}
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

        {/* ── Label Render Area ─────────────────────────────────────── */}
        {/*
          The id="nutrition-label" div is what html-to-image captures.
          It must contain only the label component — no toolbar buttons.
        */}
        <div id="nutrition-label" className="flex justify-center bg-white rounded-lg">
          {LabelComponent && <LabelComponent data={nutritionData} />}
        </div>

        {/* ── Optional Label Info Panel ─────────────────────────────── */}
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
    </div>
  );
};

export default LabelPreview;
