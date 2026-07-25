import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import { Button } from "@/components/base/buttons/button";

interface CropRect {
    x: number;
    y: number;
    size: number;
}

interface ImageCropperProps {
    /** Source image as an object URL or data URL */
    imageSrc: string;
    /** Output size in pixels (both width and height) */
    outputSize?: number;
    /** Called with the cropped image blob */
    onCropComplete: (blob: Blob) => void;
    /** Called when the user cancels */
    onCancel: () => void;
}

function cropImage(
    img: HTMLImageElement,
    cropRect: CropRect,
    outputSize: number,
): Promise<Blob> {
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d")!;

    ctx.drawImage(
        img,
        cropRect.x,
        cropRect.y,
        cropRect.size,
        cropRect.size,
        0,
        0,
        outputSize,
        outputSize,
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) =>
                blob ? resolve(blob) : reject(new Error("Crop failed")),
            "image/jpeg",
            0.9,
        );
    });
}

export function ImageCropper({
    imageSrc,
    outputSize = 400,
    onCropComplete,
    onCancel,
}: ImageCropperProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const [imageLoaded, setImageLoaded] = useState(false);
    const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
    const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, size: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [cropStart, setCropStart] = useState<CropRect>({ x: 0, y: 0, size: 0 });
    const [isCropping, setIsCropping] = useState(false);

    // Scale factor between displayed image and natural image
    const [scale, setScale] = useState(1);

    const initCrop = useCallback(() => {
        const img = imgRef.current;
        const container = containerRef.current;
        if (!img || !container) return;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const imgNatWidth = img.naturalWidth;
        const imgNatHeight = img.naturalHeight;

        // Fit image within container
        const scaleX = containerWidth / imgNatWidth;
        const scaleY = containerHeight / imgNatHeight;
        const fitScale = Math.min(scaleX, scaleY);

        const dispWidth = imgNatWidth * fitScale;
        const dispHeight = imgNatHeight * fitScale;

        setDisplaySize({ width: dispWidth, height: dispHeight });
        setScale(fitScale);

        // Initial crop: centered square, 80% of the smaller dimension
        const minDim = Math.min(dispWidth, dispHeight);
        const initSize = minDim * 0.8;
        setCropRect({
            x: (dispWidth - initSize) / 2,
            y: (dispHeight - initSize) / 2,
            size: initSize,
        });

        setImageLoaded(true);
    }, []);

    useEffect(() => {
        const img = imgRef.current;
        if (!img) return;

        if (img.complete && img.naturalWidth > 0) {
            initCrop();
        }
    }, [initCrop]);

    const handleImageLoad = () => {
        initCrop();
    };

    const getPointerPos = (e: React.PointerEvent | PointerEvent) => {
        const container = containerRef.current;
        if (!container) return { x: 0, y: 0 };
        const rect = container.getBoundingClientRect();
        // Offset within the displayed image area
        const offsetX = (container.clientWidth - displaySize.width) / 2;
        const offsetY = (container.clientHeight - displaySize.height) / 2;
        return {
            x: e.clientX - rect.left - offsetX,
            y: e.clientY - rect.top - offsetY,
        };
    };

    const clampCrop = (rect: CropRect): CropRect => {
        const minSize = 40;
        let { x, y, size } = rect;
        size = Math.max(minSize, Math.min(size, displaySize.width, displaySize.height));
        x = Math.max(0, Math.min(x, displaySize.width - size));
        y = Math.max(0, Math.min(y, displaySize.height - size));
        return { x, y, size };
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        const pos = getPointerPos(e);
        const { x, y, size } = cropRect;

        // Check if near the bottom-right corner for resizing
        const cornerSize = 24;
        const isNearCorner =
            pos.x >= x + size - cornerSize &&
            pos.x <= x + size + cornerSize &&
            pos.y >= y + size - cornerSize &&
            pos.y <= y + size + cornerSize;

        if (isNearCorner) {
            setIsResizing(true);
            setDragStart(pos);
            setCropStart({ ...cropRect });
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            return;
        }

        // Check if inside crop area for dragging
        if (pos.x >= x && pos.x <= x + size && pos.y >= y && pos.y <= y + size) {
            setIsDragging(true);
            setDragStart(pos);
            setCropStart({ ...cropRect });
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging && !isResizing) return;

        const pos = getPointerPos(e);
        const dx = pos.x - dragStart.x;
        const dy = pos.y - dragStart.y;

        if (isDragging) {
            setCropRect(
                clampCrop({
                    x: cropStart.x + dx,
                    y: cropStart.y + dy,
                    size: cropStart.size,
                }),
            );
        } else if (isResizing) {
            // Use the larger delta to maintain 1:1
            const delta = Math.max(dx, dy);
            setCropRect(
                clampCrop({
                    x: cropStart.x,
                    y: cropStart.y,
                    size: cropStart.size + delta,
                }),
            );
        }
    };

    const handlePointerUp = () => {
        setIsDragging(false);
        setIsResizing(false);
    };

    const handleConfirm = async () => {
        const img = imgRef.current;
        if (!img) return;

        setIsCropping(true);

        try {
            // Convert display crop to natural image coordinates
            const naturalCrop: CropRect = {
                x: cropRect.x / scale,
                y: cropRect.y / scale,
                size: cropRect.size / scale,
            };

            const blob = await cropImage(img, naturalCrop, outputSize);
            onCropComplete(blob);
        } catch {
            // If crop fails, still call cancel to close the modal
            onCancel();
        } finally {
            setIsCropping(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                <motion.div
                    className="mx-4 w-full max-w-sm overflow-hidden rounded-2xl bg-white"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                >
                    {/* Image area with crop overlay */}
                    <div
                        ref={containerRef}
                        className="relative flex aspect-square items-center justify-center overflow-hidden bg-neutral-100"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        style={{ touchAction: "none" }}
                    >
                        <img
                            ref={imgRef}
                            src={imageSrc}
                            alt="Imagen a recortar"
                            onLoad={handleImageLoad}
                            className="pointer-events-none max-h-full max-w-full object-contain"
                            style={{
                                width: displaySize.width || "auto",
                                height: displaySize.height || "auto",
                            }}
                        />

                        {/* Crop overlay */}
                        {imageLoaded && (
                            <div
                                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                            >
                                {/* Dark overlay mask using 4 divs around the crop area */}
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        background: "rgba(0, 0, 0, 0.5)",
                                        clipPath: `polygon(
                                            0% 0%, 100% 0%, 100% 100%, 0% 100%,
                                            0% 0%,
                                            ${((containerRef.current?.clientWidth ?? 0) - displaySize.width) / 2 + cropRect.x}px ${((containerRef.current?.clientHeight ?? 0) - displaySize.height) / 2 + cropRect.y}px,
                                            ${((containerRef.current?.clientWidth ?? 0) - displaySize.width) / 2 + cropRect.x}px ${((containerRef.current?.clientHeight ?? 0) - displaySize.height) / 2 + cropRect.y + cropRect.size}px,
                                            ${((containerRef.current?.clientWidth ?? 0) - displaySize.width) / 2 + cropRect.x + cropRect.size}px ${((containerRef.current?.clientHeight ?? 0) - displaySize.height) / 2 + cropRect.y + cropRect.size}px,
                                            ${((containerRef.current?.clientWidth ?? 0) - displaySize.width) / 2 + cropRect.x + cropRect.size}px ${((containerRef.current?.clientHeight ?? 0) - displaySize.height) / 2 + cropRect.y}px,
                                            ${((containerRef.current?.clientWidth ?? 0) - displaySize.width) / 2 + cropRect.x}px ${((containerRef.current?.clientHeight ?? 0) - displaySize.height) / 2 + cropRect.y}px,
                                            0% 0%
                                        )`,
                                    }}
                                />
                                {/* Crop selection border */}
                                <div
                                    className="absolute rounded border-2 border-white shadow-lg"
                                    style={{
                                        left:
                                            ((containerRef.current?.clientWidth ?? 0) -
                                                displaySize.width) /
                                                2 +
                                            cropRect.x,
                                        top:
                                            ((containerRef.current?.clientHeight ?? 0) -
                                                displaySize.height) /
                                                2 +
                                            cropRect.y,
                                        width: cropRect.size,
                                        height: cropRect.size,
                                    }}
                                >
                                    {/* Corner resize handle */}
                                    <div className="absolute -right-2 -bottom-2 size-4 rounded-full border-2 border-white bg-white shadow" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer buttons */}
                    <div className="grid grid-cols-2 gap-3 border-t p-4">
                        <Button
                            type="button"
                            color="secondary"
                            size="xl"
                            onClick={onCancel}
                            isDisabled={isCropping}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            color="primary"
                            size="xl"
                            onClick={handleConfirm}
                            isLoading={isCropping}
                            showTextWhileLoading
                        >
                            Recortar
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
