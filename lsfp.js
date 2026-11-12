/**
 * LSFP (LelelelingStudio's Format Picture) Web Core Library
 * Version: 2.0.0
 * License: Apache 2.0
 * Copyright: 了了了岭工作室 (LelelelingStudio)
 */
class LSFP {
    /**
     * 将 Canvas 像素数据编码为 LSFP Blob
     * @param {ImageData} imgData - Canvas 提取的原始像素数据
     * @returns {Promise<Blob>} - 返回压缩后的 LSFP 文件流
     */
    static async encode(imgData) {
        const data = imgData.data;
        const width = imgData.width;
        const height = imgData.height;
        
        const colorCounts = new Map();
        for (let i = 0; i < data.length; i += 4) {
            const a = data[i+3];
            if (a === 0) continue; // 透明背景暂不记录
            
            let r = data[i], g = data[i+1], b = data[i+2];
            if (a < 255) { // 处理半透明，与白底混合
                r = Math.round((r * a + 255 * (255 - a)) / 255);
                g = Math.round((g * a + 255 * (255 - a)) / 255);
                b = Math.round((b * a + 255 * (255 - a)) / 255);
            }
            const hex = (r << 16) | (g << 8) | b;
            colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
        }

        let sortedColors = [...colorCounts.entries()].sort((a, b) => b[1] - a[1]);
        let palette = [];
        let colorMap = new Map();

        // 颜色量化算法
        if (sortedColors.length <= 256) {
            sortedColors.forEach(([hex], idx) => {
                palette.push([(hex >> 16) & 0xFF, (hex >> 8) & 0xFF, hex & 0xFF]);
                colorMap.set(hex, idx);
            });
        } else {
            const buckets = new Map();
            for (const [hex, count] of sortedColors) {
                const r = (hex >> 16) & 0xFF, g = (hex >> 8) & 0xFF, b = hex & 0xFF;
                const bucketKey = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
                if (!buckets.has(bucketKey)) buckets.set(bucketKey, { r: 0, g: 0, b: 0, count: 0 });
                const bucket = buckets.get(bucketKey);
                bucket.r += r * count; bucket.g += g * count; bucket.b += b * count; bucket.count += count;
            }
            
            const sortedBuckets = [...buckets.values()].sort((a, b) => b.count - a.count).slice(0, 256);
            sortedBuckets.forEach((bucket) => {
                palette.push([
                    Math.round(bucket.r / bucket.count),
                    Math.round(bucket.g / bucket.count),
                    Math.round(bucket.b / bucket.count)
                ]);
            });

            for (const [hex] of sortedColors) {
                const r = (hex >> 16) & 0xFF, g = (hex >> 8) & 0xFF, b = hex & 0xFF;
                let minDist = Infinity, bestIdx = 0;
                for (let i = 0; i < palette.length; i++) {
                    const pr = palette[i][0], pg = palette[i][1], pb = palette[i][2];
                    const dist = (r - pr)**2 + (g - pg)**2 + (b - pb)**2;
                    if (dist < minDist) { minDist = dist; bestIdx = i; }
                }
                colorMap.set(hex, bestIdx);
            }
        }

        const totalPixels = width * height;
        const pixels = new Uint8Array(totalPixels);
        for (let i = 0, p = 0; i < data.length; i += 4, p++) {
            const a = data[i+3];
            if (a === 0) { pixels[p] = 0; continue; }
            let r = data[i], g = data[i+1], b = data[i+2];
            if (a < 255) {
                r = Math.round((r * a + 255 * (255 - a)) / 255);
                g = Math.round((g * a + 255 * (255 - a)) / 255);
                b = Math.round((b * a + 255 * (255 - a)) / 255);
            }
            pixels[p] = colorMap.get((r << 16) | (g << 8) | b);
        }

        // 构建二进制流
        const buffer = [];
        const writeU8 = (v) => buffer.push(v & 0xFF);
        const writeU16 = (v) => { writeU8(v); writeU8(v >> 8); };
        const writeU32 = (v) => { writeU16(v & 0xFFFF); writeU16(v >> 16); };
        
        writeU8(0x4C); writeU8(0x53); writeU8(0x46); writeU8(0x50); writeU8(0x03); writeU8(0x00); // LSFP v3
        writeU32(width); writeU32(height);

        writeU16(palette.length);
        for (let i = 0; i < palette.length; i++) { writeU8(palette[i][0]); writeU8(palette[i][1]); writeU8(palette[i][2]); }

        // 写入 RLE
        writeU8(0x01); 
        const rleData = [];
        for (let i = 0; i < totalPixels; ) {
            const currentColorId = pixels[i];
            let runLength = 1;
            while (i + runLength < totalPixels && pixels[i + runLength] === currentColorId && runLength < 65535) runLength++;
            rleData.push(currentColorId & 0xFF, (currentColorId >> 8) & 0xFF, runLength & 0xFF, (runLength >> 8) & 0xFF);
            i += runLength;
        }
        writeU32(rleData.length); rleData.forEach(b => writeU8(b));
        writeU8(0xFF); writeU32(0);

        // Gzip 压缩并返回
        const cs = new CompressionStream('gzip');
        const writer = cs.writable.getWriter();
        writer.write(new Uint8Array(buffer));
        writer.close();
        return await new Response(cs.readable).blob();
    }

    /**
     * 解析 LSFP ArrayBuffer 并返回 ImageData
     * @param {ArrayBuffer} buffer - 原始文件流
     * @returns {Promise<ImageData>}
     */
    static async decode(buffer) {
        const uint8Array = new Uint8Array(buffer);
        let rawBuffer;
        
        // 检查是否是 Gzip 压缩
        if (uint8Array[0] === 0x1F && uint8Array[1] === 0x8B) {
            const ds = new DecompressionStream('gzip');
            const writer = ds.writable.getWriter();
            writer.write(uint8Array);
            writer.close();
            rawBuffer = await new Response(ds.readable).arrayBuffer();
        } else {
            rawBuffer = buffer; 
        }

        const dataView = new DataView(rawBuffer);
        let offset = 0;
        const magic = String.fromCharCode(dataView.getUint8(0), dataView.getUint8(1), dataView.getUint8(2), dataView.getUint8(3));
        if (magic !== 'LSFP') throw new Error("Invalid LSFP format");
        offset += 6; 
        
        const width = dataView.getUint32(offset, true); offset += 4;
        const height = dataView.getUint32(offset, true); offset += 4;
        
        const colorCount = dataView.getUint16(offset, true); offset += 2;
        const palette = [];
        for (let i = 0; i < colorCount; i++) {
            palette.push([dataView.getUint8(offset++), dataView.getUint8(offset++), dataView.getUint8(offset++)]);
        }

        const imgData = new ImageData(width, height);
        const data = imgData.data;

        let pixelIndex = 0;
        while (offset < rawBuffer.byteLength) {
            const blockType = dataView.getUint8(offset++);
            const blockLength = dataView.getUint32(offset, true); offset += 4;
            if (blockType === 0xFF) break;
            
            if (blockType === 0x01) { // RLE
                const endOfBlock = offset + blockLength;
                while (offset < endOfBlock) {
                    const colorId = dataView.getUint16(offset, true); offset += 2;
                    const runLength = dataView.getUint16(offset, true); offset += 2;
                    const rgb = palette[colorId] || [0,0,0];
                    for (let r = 0; r < runLength; r++) {
                        if (pixelIndex >= width * height * 4) break;
                        data[pixelIndex++] = rgb[0]; data[pixelIndex++] = rgb[1]; data[pixelIndex++] = rgb[2]; data[pixelIndex++] = 255;
                    }
                }
            } else if (blockType === 0x02) { // 矩形块兼容
                const endOfBlock = offset + blockLength;
                while (offset < endOfBlock) {
                    const colorId = dataView.getUint16(offset, true); offset += 2;
                    const x = dataView.getUint16(offset, true); offset += 2;
                    const y = dataView.getUint16(offset, true); offset += 2;
                    const w = dataView.getUint16(offset, true); offset += 2;
                    const h = dataView.getUint16(offset, true); offset += 2;
                    const rgb = palette[colorId] || [0,0,0];
                    for (let dy = 0; dy < h; dy++) {
                        for (let dx = 0; dx < w; dx++) {
                            const px = x + dx, py = y + dy;
                            if (px < width && py < height) {
                                const idx = (py * width + px) * 4;
                                data[idx] = rgb[0]; data[idx+1] = rgb[1]; data[idx+2] = rgb[2]; data[idx+3] = 255;
                            }
                        }
                    }
                }
            } else {
                offset += blockLength;
            }
        }
        return imgData;
    }
}

/* --------------------------------------------------------------------------
 * 本站内置适配（lelele-game）：
 * 上游以经典脚本提供顶层 `class LSFP`，只产生全局词法绑定、不会挂到 window。
 * 这里显式挂载一次，让「按需懒加载后」的特性检测与离线场景保持一致。
 * encode/decode 实现完全未改；Apache-2.0 许可与上游署名见 LSFP-NOTICE.txt。
 * ------------------------------------------------------------------------ */
if (typeof window !== 'undefined') { window.LSFP = LSFP; }
