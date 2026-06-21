/**
 * ============================================================
 * Label Preview Component
 * ============================================================
 *
 * Renders the selected nutrition label format with:
 *   - Format selector dropdown (US, EU, Indian, Canada, Australia)
 *   - Download button (exports label as high-res PNG)
 *   - Zoom button (opens label in fullscreen modal) ← ADDED 1.6
 *   - Optional label information panel
 *
 * ADDED (1.6): Label Zoom / Preview Modal
 *   Strategy: Option A — two separate renders of the label component.
 *     - Card render: small preview, holds id="nutrition-label" for download
 *     - Modal render: full-size display, no id, read-only
 *   Both renders share the same `format` state so switching format
 *   inside the modal also updates the card preview and vice versa.
 *
 *   New state added: isModalOpen (boolean) — nothing else changed.
 *
 * PRESERVED (1.4):
 *   - Toast notifications for download lifecycle
 *   - Loading spinner on Download button
 *
 * PRESERVED (all):
 *   - id="nutrition-label" stays on card element only
 *   - All 5 label formats
 *   - 300 DPI download export
 *   - Label info panel
 *   - onFormatChange callback
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
import {
  ChevronDown,
  Download,
  Globe,
  Loader2,
  ZoomIn,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
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
 * Maps each LabelFormat key to its React component.
 * Both the card preview and the modal render pull from this map.
 * Add new country formats here — dropdown auto-populates.
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

  // ── State ─────────────────────────────────────────────────────────────

  /** Currently selected label format — shared between card and modal */
  const [format, setFormat] = useState<LabelFormat>(defaultFormat);

  /** Controls PNG generation loading state on the Download button */
  const [isDownloading, setIsDownloading] = useState(false);

  /**
   * Controls modal open/close.
   * ADDED (1.6): Only new state introduced in this feature.
   */
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────

  /**
   * handleFormatChange
   *
   * Updates format state and notifies parent if callback provided.
   * Because both card and modal read the same `format` state,
   * changing format in either location updates both simultaneously.
   */
  const handleFormatChange = (newFormat: LabelFormat) => {
    setFormat(newFormat);
    onFormatChange?.(newFormat);
  };

  /**
   * downloadLabel
   *
   * Captures the #nutrition-label DOM element (card render only —
   * the modal render has no id) as a high-resolution PNG and
   * triggers a browser download.
   *
   * Resolution: 300 DPI via 3× scale factor (96 DPI × 3 ≈ 288 DPI)
   *
   * IMPORTANT: This always targets id="nutrition-label" which lives
   * on the card element. The modal element has no id so it is never
   * accidentally captured regardless of modal open/close state.
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
      const scaleFactor = 300 / 96; // target 300 DPI from 96 DPI screen
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

          {/* Format selector dropdown */}
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

          {/* Right-side action buttons */}
          <div className="flex items-center gap-2">

            {/*
              Zoom button — ADDED (1.6)
              Opens the modal with a full-size render of the current label.
              Uses ZoomIn icon from lucide-react (already installed).
            */}
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(true)}
              className="hover:text-primary-foreground"
              title="View full size"
            >
              <ZoomIn className="h-4 w-4 mr-2" />
              Full Size
            </Button>

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
        </div>

        {/*
          ── Card Label Render ────────────────────────────────────────
          This is the ONLY element with id="nutrition-label".
          html-to-image always captures this element for downloads.
          The modal render below has NO id.
        */}
        <div
          id="nutrition-label"
          className="flex justify-center bg-white rounded-lg"
        >
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

      {/* ══════════════════════════════════════════════════════════════════
          LABEL ZOOM MODAL — ADDED (1.6)
          ══════════════════════════════════════════════════════════════════
          Uses @radix-ui/react-dialog directly (already installed as a
          dependency of shadcn). No additional packages needed.
          
          Behaviour:
          - Opens when user clicks "Full Size" button
          - Closes on X button click, Escape key, or overlay click
          - Format selector inside modal is synced with card (same state)
          - Download button inside modal downloads from card's element
            (id="nutrition-label") not from the modal render
          - Modal label render has NO id to prevent any conflict
      ══════════════════════════════════════════════════════════════════ */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>

          {/* ── Backdrop overlay ──────────────────────────────────── */}
          <Dialog.Overlay
            className={cn(
              'fixed inset-0 z-50 bg-black/70',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
            )}
          />

          {/* ── Modal Content ──────────────────────────────────────── */}
          <Dialog.Content
            className={cn(
              // Positioning — centered on screen
              'fixed left-[50%] top-[50%] z-50',
              'translate-x-[-50%] translate-y-[-50%]',
              // Sizing — wide enough to show label clearly
              'w-[95vw] max-w-2xl',
              'max-h-[90vh]',
              // Appearance
              'bg-white rounded-xl shadow-2xl',
              'flex flex-col',
              // Entrance animation
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2',
              'data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%]',
              'duration-200'
            )}
          >

            {/* ── Modal Header ──────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
              <div className="flex items-center gap-3">
                <Dialog.Title className="text-lg font-semibold">
                  Label Preview
                </Dialog.Title>
                <Badge variant="secondary">{format} Format</Badge>
              </div>

              {/* Modal toolbar — format selector + download + close */}
              <div className="flex items-center gap-2">

                {/* Format selector inside modal — same handler, same state */}
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

                {/*
                  Download button inside modal.
                  Calls the same downloadLabel() handler which always
                  targets id="nutrition-label" on the card — not this modal.
                */}
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

                {/* Close button */}
                <Dialog.Close asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </Dialog.Close>
              </div>
            </div>

            {/* ── Modal Body — scrollable label display ─────────────── */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex justify-center items-start p-8 bg-gray-50 min-h-full">
                {/*
                  Full-size label render.
                  Intentionally has NO id attribute.
                  This is a display-only render — download always uses
                  the card's id="nutrition-label" element.
                */}
                {LabelComponent && (
                  <div className="shadow-lg rounded">
                    <LabelComponent data={nutritionData} />
                  </div>
                )}
              </div>
            </div>

            {/* ── Modal Footer ──────────────────────────────────────── */}
            <div className="px-6 py-3 border-t bg-gray-50 rounded-b-xl flex-shrink-0">
              <p className="text-xs text-gray-500 text-center">
                Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">Esc</kbd> or click outside to close
              </p>
            </div>

          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
};

export default LabelPreview;
