/**
 * Meijster 精确欧氏距离变换 (EDT)
 *
 * 给定二值蒙版（true = 前景/文字像素），计算每个像素到最近前景像素的
 * 欧氏距离平方值。时间复杂度 O(W×H)，替代 O(W×H×π×R²) 的圆形膨胀。
 *
 * 参考：Meijster, Roerdink, Hesselink (2000)
 * "A General Algorithm for Computing Distance Transforms in Linear Time"
 */

const INF = 1e9; // 使用较小的值，确保 INF² 不会溢出 Float32 (max ~3.4e38)

/**
 * 计算二值蒙版的欧氏距离平方变换
 * @param mask 布尔数组，true 表示前景（文字）像素
 * @param width 图像宽度
 * @param height 图像高度
 * @returns Float32Array，每个元素为该像素到最近前景像素的欧氏距离平方
 */
export function euclideanDistanceTransform(
  mask: boolean[],
  width: number,
  height: number
): Float32Array {
  const size = width * height;
  const dt = new Float32Array(size);

  // 临时数组
  const f = new Float32Array(Math.max(width, height));
  const z = new Float32Array(Math.max(width, height) + 1);
  const v = new Int32Array(Math.max(width, height));

  // 阶段 1：逐列 1D 距离变换
  // 对每列，计算每个像素到该列内最近前景像素的距离平方
  for (let x = 0; x < width; x++) {
    // 前向扫描
    if (mask[x]) {
      dt[x] = 0;
    } else {
      dt[x] = INF;
    }
    for (let y = 1; y < height; y++) {
      const idx = y * width + x;
      if (mask[idx]) {
        dt[idx] = 0;
      } else {
        dt[idx] = dt[(y - 1) * width + x] + 1;
      }
    }
    // 后向扫描
    for (let y = height - 2; y >= 0; y--) {
      const idx = y * width + x;
      const below = dt[(y + 1) * width + x] + 1;
      if (below < dt[idx]) {
        dt[idx] = below;
      }
    }
    // 转为距离平方
    for (let y = 0; y < height; y++) {
      const idx = y * width + x;
      dt[idx] = dt[idx] * dt[idx];
    }
  }

  // 阶段 2：逐行使用抛物线下包络线完成二维 EDT
  for (let y = 0; y < height; y++) {
    const offset = y * width;

    // 读取该行的列距离平方到 f[]
    for (let x = 0; x < width; x++) {
      f[x] = dt[offset + x];
    }

    // 计算下包络线
    let k = 0;
    v[0] = 0;
    z[0] = -INF;
    z[1] = INF;

    for (let q = 1; q < width; q++) {
      let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) {
        k--;
        s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      }
      k++;
      v[k] = q;
      z[k] = s;
      z[k + 1] = INF;
    }

    // 回填该行的最终距离平方
    k = 0;
    for (let q = 0; q < width; q++) {
      while (z[k + 1] < q) {
        k++;
      }
      const dx = q - v[k];
      dt[offset + q] = dx * dx + f[v[k]];
    }
  }

  return dt;
}
