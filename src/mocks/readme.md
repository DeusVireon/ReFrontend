此目录用于本地演示数据加载与 SSE 推送，不连接真实后端。

`public/mock-data.csv` 由 `scripts/generate-demo-mock.mjs` 生成，固定展示以下过程：

1. 稳定窗口与安全上升窗口；
2. 点预测仍低于 `80 mg/m3`，但校准风险越过 `16.14%`，触发概率预警；
3. 后续真实窗口的点预测越过 `80 mg/m3`，告警升级；
4. 新一轮真实窗口的风险回落到阈值以下，告警解除。

预测曲线、分位数、90% conformal 区间和校准风险均来自正式 PA-PFT Performance
模型的 development_val 重推结果；相邻关键帧之间只对传感器面板数值做平滑插值。
DCA 是独立的看板辅助信息，不参与 PA-PFT 预测或报警判定。

运行 `pnpm mock:generate` 可重新生成数据。详细来源、关键帧数值和使用步骤见
`docs/VIDEO_DEMO_DATA.md`。
