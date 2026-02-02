import html2canvas from "html2canvas";

export interface PreviewCaptureResult {
  base64: string;
  width: number;
  height: number;
}

/**
 * Captures a screenshot of an iframe's content
 * Works with same-origin iframes (srcdoc)
 */
export const capturePreviewScreenshot = async (
  iframe: HTMLIFrameElement
): Promise<PreviewCaptureResult | null> => {
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc?.body) {
      console.error("Cannot access iframe document");
      return null;
    }

    // Use html2canvas to capture the iframe content
    const canvas = await html2canvas(iframeDoc.body, {
      backgroundColor: "#ffffff",
      scale: 0.5, // Lower scale for smaller file size
      logging: false,
      useCORS: true,
      allowTaint: true,
      width: Math.min(iframeDoc.body.scrollWidth, 1200),
      height: Math.min(iframeDoc.body.scrollHeight, 800),
    });

    // Convert to base64 JPEG for smaller size
    const base64 = canvas.toDataURL("image/jpeg", 0.7);

    return {
      base64,
      width: canvas.width,
      height: canvas.height,
    };
  } catch (error) {
    console.error("Failed to capture preview screenshot:", error);
    return null;
  }
};
