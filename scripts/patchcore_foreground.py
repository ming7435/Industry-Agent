"""Conservative object ROI for the audited white-gear camera domain only."""

def foreground_mask(image):
    import cv2
    import numpy as np

    pixels = np.asarray(image.convert('RGB'))
    bright = ((pixels[:, :, 2] > 40) & (pixels[:, :, 1] > 35)).astype(np.uint8)
    bright = cv2.morphologyEx(bright, cv2.MORPH_CLOSE, np.ones((5, 5), dtype=np.uint8))
    contours, _ = cv2.findContours(bright, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        raise ValueError('No supported foreground object; manual review required')
    contour = max(contours, key=cv2.contourArea)
    if cv2.contourArea(contour) < image.width * image.height * .03:
        raise ValueError('Insufficient foreground object; manual review required')
    mask = np.zeros_like(bright)
    # External-contour filling deliberately keeps dark stains and the center
    # hole. Pixel-wise brightness thresholding would hide dark defects.
    cv2.drawContours(mask, [contour], -1, 1, thickness=-1)
    margin = max(3, round(min(image.size) * .015))
    mask = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * margin + 1, 2 * margin + 1)))
    return mask.astype(bool)
