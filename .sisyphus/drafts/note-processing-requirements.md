# 草案：模糊字体遮盖处理需求

## 用户需求摘要

用户有两张"一样的"图片：
1. **清晰原图（图片A）**: 只有原文，字体清晰，无笔记
2. **笔记图片（图片B）**: 同一张图，但空白处有手写笔记，同时原文部分字体已模糊（可能是笔记覆盖或拍摄问题）

**目标处理流程**:
1. 识别图片B中"模糊字体"的区域
2. 用色块遮盖这些模糊区域
3. 将图片A（清晰原文）和遮盖后的图片B叠加
4. 最终结果：清晰的原文 + 笔记内容

## 现有功能分析

项目已具备强大的图片处理能力，主要功能包括：

### 核心处理函数 (imageProcessor.ts)
- `extractTextMask()`: 通过亮度阈值识别文字区域，支持边缘引导膨胀
- `applyMaskOverlay()`: 将两张图片按遮罩区域叠加
- `processImagePair()`: 完整处理流程

### 现有叠加逻辑
当前实现的是**反向逻辑**：
- 识别标注图（图片B）的文字区域
- **文字区域**：保留原图（图片A）像素
- **非文字区域**：按透明度叠加标注图（图片B）

### ProcessingOptions 参数
- `annotationOpacity`: 标注层混合透明度
- `textThreshold`: 文字检测亮度阈值（0-255）
- `maskExpand`: 遮罩扩展半径（像素）
- `useEdgeGuidedExpand`: 边缘引导膨胀
- `edgeThreshold`: 边缘强度阈值

## 需求 vs 现有功能对比

| 步骤 | 现有功能 | 用户需求 |
|------|----------|----------|
| 识别区域 | 识别标注图的文字区域 | 识别标注图中"模糊原文"区域 |
| 处理方式 | 文字区域用原图 | 模糊区域用原图 |
| 叠加逻辑 | 保留标注图的笔记 | 保留标注图的笔记 |

## 关键问题澄清

### 问题1：模糊字体如何定义？
用户需要明确"模糊字体"的具体表现：
- 是亮度较低的区域？
- 是被笔记覆盖的区域？
- 还是笔画边缘不清晰的区域？

### 问题2：现有的"叠加"功能是否可以使用？
现有功能实际上可能已经可以实现类似效果，需要确认：
- 如果将清晰的图片作为"原图"，有笔记的图片作为"标注图"
- 现有的算法是否能正确识别并保留笔记区域？

### 问题3：处理顺序
两种可能的实现方案：

**方案A：先识别模糊区域**
1. 分析图片B，识别出"模糊字体"的像素
2. 生成遮罩（模糊区域为true）
3. 叠加时，遮罩区域使用图片A（清晰），其他区域使用图片B（带笔记）

**方案B：直接使用现有功能**
1. 图片A（清晰）= "原图"
2. 图片B（带笔记）= "标注图"
3. 现有算法会自动识别图片B中的文字（包括模糊原文和笔记）
4. 但如果原文已模糊，可能不会被识别为文字区域

### 问题4：色块遮盖的必要性
用户提到"先加色块遮盖模糊字体"，这是否意味着：
- 需要生成一个遮罩层（显示为色块）让用户预览？
- 还是直接进行叠加，色块只是中间过程？

## 待澄清的问题清单

1. 用户是否尝试过现有的叠加功能？效果如何？
2. "模糊字体"具体表现是什么？是整体模糊还是被笔记部分遮挡？
3. 是否需要先预览遮罩区域？还是直接得到最终结果？
4. 是否有示例图片可以分析？

## 技术实现思路（待确认）

### 可能的实现方向

**方向1：改进文字检测算法**
- 调整`textThreshold`阈值
- 降低阈值，让更多模糊文字被识别
- 使用更大的`maskExpand`扩展半径

**方向2：反向叠加逻辑**
- 修改`applyMaskOverlay`函数，使其支持反向逻辑
- 遮罩区域使用清晰原图，其他区域保留带笔记的图片

**方向3：两步处理法**
- 第一步：生成遮罩预览，让用户调整参数
- 第二步：使用最终参数进行叠加

## GitHub 相关项目参考

以下是与用户场景相关的开源项目，可以作为技术参考：

### 图片融合/叠加项目

1. **anttikon/image-glue** ⭐ 较老但经典
   - JavaScript library to combine two images together
   - https://github.com/anttikon/image-glue
   - 简单的图片合并功能

2. **lcrojano/visual-merge-images**
   - 可视化图片融合工具
   - https://github.com/lcrojano/visual-merge-images
   - 提供Web UI进行图片融合

3. **ccpu/join-images** ⭐ 31 stars (已归档)
   - Merge multiple images into a single image
   - https://github.com/ccpu/join-images
   - 支持将多张图片合并

4. **hmellow/Image-Amalgamator**
   - npm package that can merge several images together
   - https://github.com/hmellow/Image-Amalgamator
   - 提供了可编程的API

5. **cx690/merge-images-grid**
   - Merge images on canvas, looks like grid template
   - https://github.com/cx690/merge-images-grid
   - 支持网格布局的图片合并

### 图像修复/填补 (Inpainting) - 类似"遮盖模糊字体"场景

1. **antimatter15/inpaint.js** ⭐ 88 stars
   - Telea Inpainting Algorithm in JS
   - https://github.com/antimatter15/inpaint.js
   - 基于Telea算法的图像修复，可用于移除不需要的区域
   - **最相关**：如果需要在模糊区域进行修复/填补，可参考此算法

2. **marmooo/inpainter**
   - An app that removes the objects of images using the inpaint algorithm
   - https://github.com/marmooo/inpainter
   - 使用OpenCV.js在浏览器中进行图像修复
   - **技术参考**：使用OpenCV.js进行前端图像处理

3. **Jkotoun/dip-image-inpainting-editor**
   - 图像修复编辑器
   - https://github.com/Jkotoun/dip-image-inpainting-editor
   - 提供交互式修复界面

4. **ahmedabdelhaleemnoby/Midjourney-Inpainting-UI**
   - A tool to replicate Midjourney's inpainting interface
   - https://github.com/ahmedabdelhaleemnoby/Midjourney-Inpainting-UI
   - 类似Midjourney的区域修复界面设计参考

### OCR/文字识别项目 - 处理手写笔记

1. **naptha/tesseract.js** ⭐ 非常流行
   - Pure Javascript OCR for more than 100 Languages
   - https://github.com/naptha/tesseract.js
   - 最知名的JavaScript OCR库
   - 可以用于识别图片中的手写笔记位置

2. **islom-pardaboyev/image_to_text_converter**
   - A React-based web app that extracts text from images using Tesseract.js
   - https://github.com/islom-pardaboyev/image_to_text_converter
   - React + Tesseract.js 实现

3. **zirkelc/highlights** ⭐ 推荐
   - Extract highlighted text from images using OCR and CV in your browser
   - https://github.com/zirkelc/highlights
   - **最相关**：专门提取标注/高亮区域，非常适合"识别笔记区域"的场景

4. **recogito/recogito-js** (已归档)
   - A JavaScript library for text annotation
   - https://github.com/recogito/recogito-js
   - 文本标注库，可参考交互设计

### 关键学习点

从以上项目可以借鉴：

1. **图像修复算法** (inpaint.js)
   - 如果需要在模糊区域进行智能修复而非简单遮盖，可以使用Telea算法
   - 但用户的场景更简单：用清晰原图替换模糊区域

2. **区域识别** (highlights, tesseract.js)
   - 可以使用OCR识别文字位置
   - 可以使用图像处理（亮度阈值、边缘检测）识别笔记区域

3. **用户界面设计**
   - Midjourney-Inpainting-UI: 提供直观的区域选择界面
   - marmooo/inpainter: 展示处理效果预览

4. **性能优化**
   - 使用Web Workers处理大型图片
   - 使用OpenCV.js进行高性能图像处理

## 建议的参考策略

对于用户的具体需求（清晰原图 + 手写笔记图片 → 合并为清晰带笔记的图片）：

**最接近的实现**：
- 参考 **zirkelc/highlights** 的"提取高亮区域"思路
- 参考 **antimatter15/inpaint.js** 的区域替换逻辑
- 实际上用户的现有代码已经比大多数项目更强大！

**技术差距**：
- 现有代码缺少"反向叠加"逻辑
- 现有代码缺少"模糊区域识别"算法（目前只识别文字区域）

## 下一步行动

需要与用户确认：
1. 对"模糊字体"的具体描述
2. 是否已尝试过现有功能
3. 期望的输出形式
4. 是否需要预览遮罩区域的功能

