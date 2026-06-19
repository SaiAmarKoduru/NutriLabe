'use client';

import { LabelFormat } from "@/app/types/nutrition";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Download, Globe } from "lucide-react";
import { useState } from "react";
import { USNutritionLabel } from "../us-nutrition-label";
import { EUNutritionLabel } from "../eu-nutrition-label";
import { IndianNutritionalLabel } from "../IndianNutritionalLabel";
import { CanadaNutritionLabel } from "../canada-nutrition-label";
import { AustraliaNutritionLabel } from "../australia-nutrition-label";
import * as htmlToImage from "html-to-image";
import { labelInfo } from "@/app/labelInfo";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LabelPreviewProps {
  nutritionData: any;
  className?: string;
  showInfo?: boolean;
  compact?: boolean;
  defaultFormat?: LabelFormat;
  onFormatChange?: (format: LabelFormat) => void;
}

const LabelPreview = ({ 
  nutritionData,
  className,
  showInfo = true,
  compact = false,
  defaultFormat = "US",
  onFormatChange
}: LabelPreviewProps) => {
  const [format, setFormat] = useState<LabelFormat>(defaultFormat);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleFormatChange = (newFormat: LabelFormat) => {
    setFormat(newFormat);
    onFormatChange?.(newFormat);
  };

  const downloadLabel = async () => {
    const element = document.getElementById("nutrition-label");
    if (!element || isDownloading) return;

    try {
      setIsDownloading(true);
      const desiredDPI = 300;
      const scaleFactor = desiredDPI / 96;
      const width = element.offsetWidth * scaleFactor;
      const height = element.offsetHeight * scaleFactor;

      const dataUrl = await htmlToImage.toPng(element, {
        width: width,
        height: height,
        style: {
          transform: `scale(${scaleFactor})`,
          transformOrigin: 'top left',
          width: `${element.offsetWidth}px`,
          height: `${element.offsetHeight}px`,
        },
        quality: 1.0,
      });

      const link = document.createElement("a");
      link.download = `nutrition-label-${format.toLowerCase()}-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const labelComponents = {
    US: USNutritionLabel,
    EU: EUNutritionLabel,
    INDIAN: IndianNutritionalLabel,
    CANADA: CanadaNutritionLabel,
    AUSTRALIA: AustraliaNutritionLabel,
  };

  const LabelComponent = labelComponents[format];

  return (
    <div className={cn("space-y-6", className)}>
      <Card className="p-2 border-none">
        {/* Header with Format Selection and Download */}
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
              {Object.keys(labelComponents).map((key) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => handleFormatChange(key as LabelFormat)}
                >
                  {key} Format
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={downloadLabel}
            variant="outline"
            disabled={isDownloading}
            className="hover:text-primary-foreground"
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? "Generating..." : "Download"}
          </Button>
        </div>

        {/* Label Preview */}
        <div id="nutrition-label" className="flex justify-center bg-white rounded-lg">
          {LabelComponent && <LabelComponent data={nutritionData} />}
        </div>

        {/* Label Information */}
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
}

export default LabelPreview;