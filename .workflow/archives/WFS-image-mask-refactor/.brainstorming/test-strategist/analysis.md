# Test Strategy Analysis Report

## Project Context

- **Tech Stack**: React 19 + TypeScript + Canvas API
- **Core Feature**: Reverse mask overlay mode for image processing
- **Processing Flow**: Clear image text detection -> Blurred image text area color block -> Composite clear text + notes

## Testing Approach Decision

**Strategy**: Implementation First, Testing After
**Primary Method**: Manual Visual Verification

---

## 1. Functional Test Cases

### 1.1 Normal Processing Flow

| Test ID | Scenario | Input | Expected Output | Priority |
|---------|----------|-------|-----------------|----------|
| F-001 | Basic image pair processing | Clear image + Annotated image (same size) | Composite image with clear text + annotations | P0 |
| F-002 | Preview generation | Valid image pair | 4-panel preview (original, annotated, mask layer, result) | P0 |
| F-003 | Batch processing | Multiple image pairs | All pairs processed correctly | P1 |
| F-004 | Download single result | Processed image | PNG file downloaded | P1 |
| F-005 | Download batch results | Multiple processed images | ZIP file with all results | P1 |

### 1.2 Threshold Effect Tests

| Test ID | Threshold Value | Expected Behavior | Verification Method |
|---------|-----------------|-------------------|---------------------|
| T-001 | Low (100-150) | Only darkest pixels detected as text | Visual: sparse mask coverage |
| T-002 | Medium (180-200) | Standard text detection | Visual: normal text coverage |
| T-003 | High (220-250) | Aggressive detection, includes light gray | Visual: extensive mask coverage |
| T-004 | Edge case (100) | Minimum detection | Visual: minimal mask |
| T-005 | Edge case (250) | Maximum detection | Visual: near-full mask |

**Verification Steps**:
1. Load test image with varying text densities
2. Adjust `textThreshold` slider
3. Observe mask preview (red overlay) changes
4. Verify text areas are correctly identified

### 1.3 Color Block Tests (Future Feature)

| Test ID | Color | Expected Behavior |
|---------|-------|-------------------|
| C-001 | White (#FFFFFF) | Default, blends with paper background |
| C-002 | Black (#000000) | High contrast, visible blocks |
| C-003 | Custom color | User-selected color applied to text regions |
| C-004 | Transparent | No color block, original behavior |

### 1.4 Processing Options Tests

| Test ID | Option | Values to Test | Expected Behavior |
|---------|--------|----------------|-------------------|
| O-001 | `annotationOpacity` | 0, 0.4, 0.7, 1.0 | Annotation visibility varies |
| O-002 | `maskExpand` | 0, 2, 5, 10 | Text mask boundary expansion |
| O-003 | `useEdgeGuidedExpand` | true/false | Edge-aware vs uniform expansion |
| O-004 | `edgeThreshold` | 30, 50, 100 | Edge detection sensitivity |

---

## 2. Boundary Test Cases

### 2.1 Image Size Mismatch

| Test ID | Scenario | Input | Expected Behavior | Priority |
|---------|----------|-------|-------------------|----------|
| B-001 | Annotated larger than original | 1920x1080 + 3840x2160 | Scale annotated to match original | P0 |
| B-002 | Annotated smaller than original | 1920x1080 + 960x540 | Scale annotated to match original | P0 |
| B-003 | Different aspect ratios | 16:9 + 4:3 | Scale with aspect ratio handling | P1 |
| B-004 | Extreme size difference | 100x100 + 4000x4000 | Handle gracefully, no crash | P1 |

**Verification Code Location**: `src/utils/imageProcessor.ts:scaleImageData()`

### 2.2 Extreme Image Content

| Test ID | Scenario | Expected Behavior | Priority |
|---------|----------|-------------------|----------|
| B-005 | All white image (255,255,255) | Empty mask, no text detected | P1 |
| B-006 | All black image (0,0,0) | Full mask, entire image as text | P1 |
| B-007 | Gradient image | Partial mask based on threshold | P2 |
| B-008 | High contrast B&W | Clear text/background separation | P1 |
| B-009 | Low contrast gray | Threshold-dependent detection | P2 |

### 2.3 Large Image Handling (4K+)

| Test ID | Resolution | Expected Behavior | Performance Target |
|---------|------------|-------------------|-------------------|
| B-010 | 1920x1080 (FHD) | Normal processing | < 500ms |
| B-011 | 2560x1440 (QHD) | Normal processing | < 1000ms |
| B-012 | 3840x2160 (4K) | Processing with progress | < 3000ms |
| B-013 | 7680x4320 (8K) | Warning or chunked processing | < 10000ms or graceful degradation |

**Memory Considerations**:
- 4K image: ~33MB raw pixel data (3840 * 2160 * 4 bytes)
- 8K image: ~132MB raw pixel data
- Browser tab memory limit: typically 1-4GB

### 2.4 No Text Image

| Test ID | Scenario | Expected Behavior | Priority |
|---------|----------|-------------------|----------|
| B-014 | Blank white page | Empty mask, result = annotated image | P1 |
| B-015 | Photo without text | Minimal/no mask, annotations visible | P1 |
| B-016 | Very light text | Threshold-dependent detection | P2 |

---

## 3. Performance Testing

### 3.1 Processing Time Benchmarks

| Image Size | Target Time | Acceptable Time | Critical Threshold |
|------------|-------------|-----------------|-------------------|
| 800x600 | < 100ms | < 200ms | > 500ms |
| 1920x1080 | < 300ms | < 500ms | > 1000ms |
| 2560x1440 | < 500ms | < 1000ms | > 2000ms |
| 3840x2160 | < 1500ms | < 3000ms | > 5000ms |

**Measurement Points**:
1. `loadImage()` - File to HTMLImageElement
2. `getImageData()` - Image to pixel array
3. `extractTextMask()` - Text detection + mask generation
4. `sobelEdgeDetect()` - Edge detection (if enabled)
5. `applyMaskOverlay()` - Final composition
6. `imageDataToBlob()` - Result encoding

### 3.2 Memory Usage Monitoring

**Key Metrics**:
- Peak memory during processing
- Memory after processing (should return to baseline)
- Memory leak detection over multiple operations

**Manual Monitoring Method**:
```javascript
// Browser DevTools Console
console.log('Before:', performance.memory.usedJSHeapSize / 1024 / 1024, 'MB');
// ... perform operation ...
console.log('After:', performance.memory.usedJSHeapSize / 1024 / 1024, 'MB');
```

**Automated Monitoring** (Future):
```typescript
// Performance wrapper for imageProcessor functions
async function measurePerformance<T>(
  fn: () => Promise<T>,
  label: string
): Promise<{ result: T; duration: number; memoryDelta: number }> {
  const startMem = performance.memory?.usedJSHeapSize || 0;
  const startTime = performance.now();

  const result = await fn();

  const duration = performance.now() - startTime;
  const memoryDelta = (performance.memory?.usedJSHeapSize || 0) - startMem;

  console.log(`[${label}] Duration: ${duration.toFixed(2)}ms, Memory: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);

  return { result, duration, memoryDelta };
}
```

### 3.3 Batch Processing Performance

| Batch Size | Target Total Time | Memory Strategy |
|------------|-------------------|-----------------|
| 5 images | < 5s | Sequential processing |
| 10 images | < 15s | Sequential with GC hints |
| 20+ images | < 60s | Consider Web Worker |

---

## 4. Visual Regression Testing

### 4.1 Output Quality Verification

**Manual Verification Checklist**:
- [ ] Text clarity preserved from original image
- [ ] Annotations visible in non-text areas
- [ ] No visible seams at mask boundaries
- [ ] Color accuracy maintained
- [ ] No artifacts or noise introduced

### 4.2 Reference Image Comparison

**Recommended Approach**: Golden Master Testing

1. **Create Reference Set**:
   - Process known test images with fixed parameters
   - Save outputs as "golden" reference images
   - Store in `test-assets/golden/` directory

2. **Comparison Method**:
   ```
   test-assets/
   ├── input/
   │   ├── clear-sample-01.png
   │   └── annotated-sample-01.png
   ├── golden/
   │   └── result-sample-01.png
   └── output/
       └── result-sample-01.png (generated during test)
   ```

3. **Visual Diff Tools** (Manual):
   - Side-by-side comparison in image viewer
   - Overlay with difference blend mode in image editor
   - Browser-based comparison using canvas

4. **Automated Comparison** (Future Enhancement):
   ```typescript
   // Pixel-by-pixel comparison
   function compareImages(img1: ImageData, img2: ImageData, tolerance: number = 5): {
     match: boolean;
     diffPixels: number;
     diffPercentage: number;
   } {
     if (img1.width !== img2.width || img1.height !== img2.height) {
       return { match: false, diffPixels: -1, diffPercentage: 100 };
     }

     let diffPixels = 0;
     const totalPixels = img1.width * img1.height;

     for (let i = 0; i < img1.data.length; i += 4) {
       const rDiff = Math.abs(img1.data[i] - img2.data[i]);
       const gDiff = Math.abs(img1.data[i + 1] - img2.data[i + 1]);
       const bDiff = Math.abs(img1.data[i + 2] - img2.data[i + 2]);

       if (rDiff > tolerance || gDiff > tolerance || bDiff > tolerance) {
         diffPixels++;
       }
     }

     const diffPercentage = (diffPixels / totalPixels) * 100;
     return {
       match: diffPercentage < 1, // Less than 1% difference
       diffPixels,
       diffPercentage
     };
   }
   ```

### 4.3 Visual Test Scenarios

| Scenario | What to Verify | Pass Criteria |
|----------|----------------|---------------|
| Text edge quality | No jagged edges on text | Smooth anti-aliased edges |
| Mask boundary | Clean transition between text/non-text | No visible halo or artifacts |
| Color preservation | Original colors maintained | < 5% color deviation |
| Annotation blending | Smooth opacity transition | No banding or posterization |

---

## 5. Test Priority Matrix

### Priority Levels

| Priority | Definition | Testing Frequency |
|----------|------------|-------------------|
| P0 | Critical - Core functionality | Every change |
| P1 | High - Important features | Major changes |
| P2 | Medium - Edge cases | Release testing |
| P3 | Low - Nice to have | Periodic review |

### Prioritized Test List

#### P0 - Critical (Must Pass)
1. **F-001**: Basic image pair processing
2. **F-002**: Preview generation
3. **B-001/B-002**: Image size mismatch handling
4. **T-002**: Standard threshold detection

#### P1 - High (Should Pass)
1. **F-003**: Batch processing
2. **F-004/F-005**: Download functionality
3. **B-005/B-006**: Extreme content (all white/black)
4. **O-001**: Annotation opacity
5. **Performance**: FHD processing < 500ms

#### P2 - Medium (Good to Pass)
1. **T-001/T-003/T-004/T-005**: Threshold edge cases
2. **B-007/B-009**: Gradient and low contrast
3. **B-010-B-013**: Large image handling
4. **O-002/O-003/O-004**: Advanced options

#### P3 - Low (Nice to Have)
1. **C-001-C-004**: Color block customization (future)
2. **Visual regression automation**
3. **Memory leak detection**

---

## 6. Test Execution Guide

### 6.1 Manual Testing Workflow

```
1. Start Development Server
   $ npm run dev

2. Open Browser DevTools
   - Console tab for errors
   - Performance tab for timing
   - Memory tab for leaks

3. Execute Test Cases
   - Follow test case table
   - Document results in spreadsheet
   - Screenshot failures

4. Report Issues
   - Create GitHub issue with:
     - Test case ID
     - Steps to reproduce
     - Expected vs actual
     - Screenshots
```

### 6.2 Test Data Requirements

**Recommended Test Images**:
1. `clear-text-standard.png` - Standard document with clear text
2. `annotated-text-standard.png` - Same document with annotations
3. `clear-text-dense.png` - Dense text document
4. `clear-text-sparse.png` - Sparse text with large margins
5. `all-white.png` - Blank white image
6. `all-black.png` - Solid black image
7. `gradient.png` - Grayscale gradient
8. `photo-no-text.png` - Photo without text
9. `4k-sample.png` - 4K resolution test image

### 6.3 Browser Compatibility

| Browser | Version | Priority |
|---------|---------|----------|
| Chrome | Latest | P0 |
| Firefox | Latest | P1 |
| Safari | Latest | P2 |
| Edge | Latest | P2 |

---

## 7. Future Testing Enhancements

### 7.1 Automated Unit Tests (Vitest)

```typescript
// Example: src/utils/__tests__/imageProcessor.test.ts
import { describe, it, expect } from 'vitest';
import { extractTextMask, getLuminance } from '../imageProcessor';

describe('getLuminance', () => {
  it('returns 0 for black', () => {
    expect(getLuminance(0, 0, 0)).toBe(0);
  });

  it('returns 255 for white', () => {
    expect(getLuminance(255, 255, 255)).toBeCloseTo(255, 0);
  });
});

describe('extractTextMask', () => {
  it('detects dark pixels as text', () => {
    // Create test ImageData with known pattern
    // Verify mask output
  });
});
```

### 7.2 E2E Tests (Playwright)

```typescript
// Example: e2e/image-processing.spec.ts
import { test, expect } from '@playwright/test';

test('processes image pair successfully', async ({ page }) => {
  await page.goto('/');

  // Upload original image
  await page.setInputFiles('[data-testid="original-upload"]', 'test-assets/clear.png');

  // Upload annotated image
  await page.setInputFiles('[data-testid="annotated-upload"]', 'test-assets/annotated.png');

  // Wait for preview
  await expect(page.locator('[data-testid="result-preview"]')).toBeVisible();

  // Download and verify
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('[data-testid="download-button"]')
  ]);

  expect(download.suggestedFilename()).toContain('.png');
});
```

### 7.3 Visual Regression with Percy/Chromatic

- Capture screenshots at key states
- Compare against baseline
- Flag visual differences for review

---

## 8. Summary

### Key Recommendations

1. **Start with P0 tests** - Ensure core functionality works before expanding
2. **Create test image set** - Standardized inputs for consistent testing
3. **Document visual expectations** - Screenshots of expected outputs
4. **Monitor performance** - Track processing times as features are added
5. **Plan for automation** - Structure code to support future unit tests

### Risk Areas

| Area | Risk Level | Mitigation |
|------|------------|------------|
| Large image memory | High | Test 4K+ images, monitor memory |
| Edge detection accuracy | Medium | Visual verification with various content |
| Browser compatibility | Medium | Test on Chrome first, expand later |
| Batch processing | Medium | Test with 10+ images |

### Next Steps

1. Create test image assets directory
2. Execute P0 test cases manually
3. Document baseline performance metrics
4. Establish golden reference images
5. Plan unit test implementation (post-feature completion)
