import { useState, useRef } from "react";

const DIMENSIONS = [
  {
    id: "scene_anchor",
    label: "物理锚点",
    weight: 12,
    desc: "V1 头两句是否落在具体时刻/场景/物件上，而非抽象情感开场",
  },
  {
    id: "imagery_level",
    label: "意境层次",
    weight: 18,
    desc: "整体意象层次：第一层堆砌词汇(0-4) / 第二层具体道具(5-8) / 第三层景即情(9-10)",
  },
  {
    id: "emotion_arc",
    label: "情绪弧线",
    weight: 15,
    desc: "全曲情绪是否有运动轨迹，V2 是否比 V1 层次更深，有无起伏变化",
  },
  {
    id: "concrete_vs_abstract",
    label: "具象化执行",
    weight: 15,
    desc: "情感是否通过行为/物件承载而非直接说出，形容词是否被名词+动词替代",
  },
  {
    id: "chorus_punch",
    label: "副歌金句力",
    weight: 15,
    desc: "副歌前两句是否可唱、可记、有冲击力，能否脱离全曲单独传播",
  },
  {
    id: "rhyme_natural",
    label: "押韵自然度",
    weight: 10,
    desc: "押韵是否流畅，有无为凑韵脚破坏句意的情况，Verse松/Chorus紧",
  },
  {
    id: "emotion_twist",
    label: "情绪反转",
    weight: 10,
    desc: "结尾或关键句是否有意外角度，是否让听众自己撞上情感而非被告知",
  },
  {
    id: "rule_compliance",
    label: "格式合规",
    weight: 5,
    desc: "无数字、无情感词直说、无音乐术语、无高频警戒词空洞使用",
  },
];

const JUDGE_SYSTEM = `你是一个专业歌词质量评审 AI，专门评估中文流行歌词的创作质量。

你需要对以下 8 个维度逐一打分（每项 0-10 分），并给出具体的扣分理由和改进建议。

评分维度说明：

1. 物理锚点（scene_anchor）
V1 头两句是否落在具体时刻/场景/物件上？
- 10分：开篇即有清晰的画面锚点，如"发动机还在暖着车/你站在楼道口抱着手"
- 5分：有一定场景感但不够具体
- 0分：直接开始抒情，如"我很痛苦""爱你是我的宿命"

2. 意境层次（imagery_level）
- 9-10分：景即情——场景是内心投射，删掉情感词场景仍传递情绪
- 5-8分：用具体日常道具承载情感（水龙头滴水、快递单、手机壁纸）
- 0-4分：堆砌约定俗成词汇（星星、月亮、泪水、远方）

3. 情绪弧线（emotion_arc）
- 9-10分：全曲有清晰运动轨迹，V2比V1深，Bridge有新突破，Final Chorus有升华
- 5-8分：有一定变化，但某段落情绪持平或重复
- 0-4分：全曲情绪一个调到底

4. 具象化执行（concrete_vs_abstract）
- 9-10分：所有情感通过行为/物件传递，无直说情感词，名词+动词主导
- 5-8分：部分句子仍有形容词堆砌
- 0-4分：大量直接情感词，如"我很孤独""你让我心碎"

5. 副歌金句力（chorus_punch）
- 9-10分：副歌前两句有意外角度，可唱可记，脱离全词仍有独立意义
- 5-8分：有一定力度但不够令人意外
- 0-4分：副歌是主歌的重复或泛泛抒情

6. 押韵自然度（rhyme_natural）
- 9-10分：押韵流畅，Verse松Chorus紧，近韵使用自然，无因韵害意
- 5-8分：押韵尚可但有1-2处勉强
- 0-4分：明显为凑韵脚破坏了句意

7. 情绪反转（emotion_twist）
- 9-10分：结尾或关键句有明显反转，听众自己撞上情感而非被告知
- 5-8分：有轻微意外感
- 0-4分：情绪一直是直给的，没有任何拐弯

8. 格式合规（rule_compliance）
- 10分：无数字、无直接情感词、无音乐术语、无高频警戒词空洞使用
- 每发现一处违规扣2分

请严格按以下 JSON 格式输出，不要有任何额外文字：
{
  "scores": {
    "scene_anchor": <0-10的整数>,
    "imagery_level": <0-10的整数>,
    "emotion_arc": <0-10的整数>,
    "concrete_vs_abstract": <0-10的整数>,
    "chorus_punch": <0-10的整数>,
    "rhyme_natural": <0-10的整数>,
    "emotion_twist": <0-10的整数>,
    "rule_compliance": <0-10的整数>
  },
  "deductions": [
    {"dimension": "<维度id>", "issue": "<具体问题>", "line": "<问题歌词原文>"}
  ],
  "highlights": [
    {"dimension": "<维度id>", "praise": "<亮点描述>", "line": "<亮点歌词原文>"}
  ],
  "overall_comment": "<50字以内的总体评价，说明这首词最大的优势和最需要改进的一点>"
}`;

function RadarChart({ scores, dimensions }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 85;
  const n = dimensions.length;

  const getPoint = (index, value) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const dist = (value / 10) * r;
    return {
      x: cx + dist * Math.cos(angle),
      y: cy + dist * Math.sin(angle),
    };
  };

  const getLabelPoint = (index) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const dist = r + 22;
    return {
      x: cx + dist * Math.cos(angle),
      y: cy + dist * Math.sin(angle),
    };
  };

  const gridLevels = [2, 4, 6, 8, 10];
  const axes = dimensions.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return {
      x1: cx,
      y1: cy,
      x2: cx + r * Math.cos(angle),
      y2: cy + r * Math.sin(angle),
    };
  });

  const scorePoints = dimensions.map((d, i) =>
    getPoint(i, scores[d.id] ?? 0)
  );
  const scorePolygon = scorePoints.map((p) => `${p.x},${p.y}`).join(" ");

  const gridPolygons = gridLevels.map((level) => {
    const pts = dimensions
      .map((_, i) => getPoint(i, level))
      .map((p) => `${p.x},${p.y}`)
      .join(" ");
    return pts;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      {gridPolygons.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      ))}
      {axes.map((ax, i) => (
        <line
          key={i}
          x1={ax.x1} y1={ax.y1} x2={ax.x2} y2={ax.y2}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      ))}
      <polygon
        points={scorePolygon}
        fill="rgba(139,92,246,0.25)"
        stroke="rgba(167,139,250,0.8)"
        strokeWidth="1.5"
      />
      {scorePoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#a78bfa" />
      ))}
      {dimensions.map((d, i) => {
        const lp = getLabelPoint(i);
        return (
          <text
            key={i}
            x={lp.x}
            y={lp.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9"
            fill="rgba(255,255,255,0.55)"
            fontFamily="system-ui, sans-serif"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

function ScoreBar({ score, max = 10, color = "#a78bfa" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 4,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${(score / max) * 100}%`,
            height: "100%",
            background: color,
            borderRadius: 2,
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 24, textAlign: "right" }}>
        {score}
      </span>
    </div>
  );
}

export default function LyricScorer() {
  const [lyric, setLyric] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("score");
  const abortRef = useRef(null);

  const totalScore = result
    ? Math.round(
        DIMENSIONS.reduce((sum, d) => {
          const s = result.scores[d.id] ?? 0;
          return sum + s * d.weight;
        }, 0) / 10
      )
    : 0;

  const getScoreColor = (score) => {
    if (score >= 80) return "#34d399";
    if (score >= 60) return "#a78bfa";
    if (score >= 40) return "#fbbf24";
    return "#f87171";
  };

  const getScoreLabel = (score) => {
    if (score >= 85) return "顶级";
    if (score >= 70) return "优秀";
    if (score >= 55) return "及格";
    if (score >= 40) return "待改";
    return "重写";
  };

  const getDimColor = (score) => {
    if (score >= 8) return "#34d399";
    if (score >= 6) return "#a78bfa";
    if (score >= 4) return "#fbbf24";
    return "#f87171";
  };

  async function runEval() {
    if (!lyric.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    const userMsg = `请评审以下歌词：

${prompt.trim() ? `【创作指令】\n${prompt.trim()}\n\n` : ""}【歌词正文】
${lyric.trim()}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: JUDGE_SYSTEM,
          messages: [{ role: "user", content: userMsg }],
        }),
      });

      const data = await res.json();
      const text = data.content?.map((b) => b.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setTab("score");
    } catch (e) {
      setError("评分失败，请检查歌词格式后重试。");
    } finally {
      setLoading(false);
    }
  }

  const s = {
    wrap: {
      minHeight: "100vh",
      background: "#0f0f13",
      color: "#e2e2e9",
      fontFamily: "'SF Pro Display', 'PingFang SC', system-ui, sans-serif",
      padding: "32px 20px 60px",
      maxWidth: 760,
      margin: "0 auto",
    },
    header: {
      marginBottom: 32,
    },
    title: {
      fontSize: 22,
      fontWeight: 700,
      color: "#fff",
      letterSpacing: "-0.3px",
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 13,
      color: "rgba(255,255,255,0.35)",
    },
    card: {
      background: "rgba(255,255,255,0.04)",
      border: "0.5px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      padding: "18px 20px",
      marginBottom: 12,
    },
    label: {
      fontSize: 11,
      fontWeight: 600,
      color: "rgba(255,255,255,0.35)",
      letterSpacing: "0.6px",
      textTransform: "uppercase",
      marginBottom: 8,
    },
    textarea: {
      width: "100%",
      background: "rgba(255,255,255,0.03)",
      border: "0.5px solid rgba(255,255,255,0.1)",
      borderRadius: 8,
      color: "#e2e2e9",
      fontSize: 13,
      lineHeight: 1.7,
      padding: "10px 12px",
      resize: "vertical",
      outline: "none",
      fontFamily: "inherit",
      boxSizing: "border-box",
    },
    btn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      width: "100%",
      padding: "13px 0",
      borderRadius: 10,
      border: "none",
      background: loading
        ? "rgba(139,92,246,0.3)"
        : "linear-gradient(135deg, #7c3aed, #6d28d9)",
      color: "#fff",
      fontSize: 14,
      fontWeight: 600,
      cursor: loading ? "not-allowed" : "pointer",
      letterSpacing: "0.2px",
      marginTop: 4,
    },
    tabs: {
      display: "flex",
      gap: 4,
      marginBottom: 16,
      background: "rgba(255,255,255,0.04)",
      borderRadius: 8,
      padding: 3,
    },
    tabBtn: (active) => ({
      flex: 1,
      padding: "7px 0",
      borderRadius: 6,
      border: "none",
      background: active ? "rgba(139,92,246,0.6)" : "transparent",
      color: active ? "#fff" : "rgba(255,255,255,0.4)",
      fontSize: 12,
      fontWeight: active ? 600 : 400,
      cursor: "pointer",
    }),
  };

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.title}>歌词质量评分系统</div>
        <div style={s.subtitle}>基于 Tunee v6.0 提示词规则 · 8维度加权评分</div>
      </div>

      {/* Input */}
      <div style={s.card}>
        <div style={s.label}>创作指令（可选）</div>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="例：写一首分手开车离开的歌"
          style={{
            ...s.textarea,
            height: 36,
            resize: "none",
            padding: "8px 12px",
            marginBottom: 14,
          }}
        />
        <div style={s.label}>歌词正文（粘贴带结构标签的完整歌词）</div>
        <textarea
          value={lyric}
          onChange={(e) => setLyric(e.target.value)}
          placeholder={"[Verse 1]\n发动机还在 暖着车\n你站在楼道口 抱着手\n...\n\n[Chorus]\n后视镜里 你还站在那\n..."}
          rows={10}
          style={s.textarea}
        />
      </div>

      <button onClick={runEval} disabled={loading || !lyric.trim()} style={s.btn}>
        {loading ? (
          <>
            <span style={{ fontSize: 16, animation: "spin 1s linear infinite" }}>⟳</span>
            AI 评审中…
          </>
        ) : (
          "开始评分"
        )}
      </button>

      {error && (
        <div style={{ color: "#f87171", fontSize: 13, marginTop: 12, textAlign: "center" }}>
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ marginTop: 28 }}>
          {/* Score hero */}
          <div
            style={{
              ...s.card,
              display: "flex",
              alignItems: "center",
              gap: 28,
              padding: "24px 24px",
            }}
          >
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div
                style={{
                  fontSize: 52,
                  fontWeight: 800,
                  color: getScoreColor(totalScore),
                  lineHeight: 1,
                  letterSpacing: "-2px",
                }}
              >
                {totalScore}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.3)",
                  marginTop: 4,
                  letterSpacing: "0.5px",
                }}
              >
                / 100
              </div>
              <div
                style={{
                  marginTop: 6,
                  display: "inline-block",
                  padding: "2px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  background: getScoreColor(totalScore) + "22",
                  color: getScoreColor(totalScore),
                  border: `0.5px solid ${getScoreColor(totalScore)}44`,
                }}
              >
                {getScoreLabel(totalScore)}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <RadarChart scores={result.scores} dimensions={DIMENSIONS} />
            </div>
            <div
              style={{
                flex: 1,
                fontSize: 13,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.7,
                fontStyle: "italic",
                borderLeft: "2px solid rgba(255,255,255,0.08)",
                paddingLeft: 16,
              }}
            >
              {result.overall_comment}
            </div>
          </div>

          {/* Tabs */}
          <div style={s.tabs}>
            {["score", "issues", "highlights"].map((t) => (
              <button key={t} style={s.tabBtn(tab === t)} onClick={() => setTab(t)}>
                {t === "score" ? "维度分数" : t === "issues" ? `扣分项 (${result.deductions?.length ?? 0})` : `亮点 (${result.highlights?.length ?? 0})`}
              </button>
            ))}
          </div>

          {tab === "score" && (
            <div style={s.card}>
              {DIMENSIONS.map((d) => {
                const score = result.scores[d.id] ?? 0;
                const weighted = Math.round((score * d.weight) / 10);
                return (
                  <div key={d.id} style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: 5,
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e2e9" }}>
                          {d.label}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.3)",
                            marginLeft: 8,
                          }}
                        >
                          {d.desc}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.25)",
                          flexShrink: 0,
                          marginLeft: 8,
                        }}
                      >
                        权重 {d.weight}% → {weighted}分
                      </span>
                    </div>
                    <ScoreBar score={score} color={getDimColor(score)} />
                  </div>
                );
              })}
            </div>
          )}

          {tab === "issues" && (
            <div>
              {result.deductions?.length === 0 ? (
                <div
                  style={{
                    ...s.card,
                    textAlign: "center",
                    color: "rgba(255,255,255,0.3)",
                    fontSize: 13,
                  }}
                >
                  没有发现明显扣分项 🎉
                </div>
              ) : (
                result.deductions?.map((d, i) => (
                  <div key={i} style={{ ...s.card, borderLeft: "2px solid #f87171" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 7px",
                          borderRadius: 20,
                          background: "rgba(248,113,113,0.15)",
                          color: "#f87171",
                          fontWeight: 600,
                        }}
                      >
                        {DIMENSIONS.find((dim) => dim.id === d.dimension)?.label ?? d.dimension}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
                      {d.issue}
                    </div>
                    {d.line && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.35)",
                          background: "rgba(255,255,255,0.03)",
                          borderRadius: 6,
                          padding: "6px 10px",
                          fontStyle: "italic",
                        }}
                      >
                        「{d.line}」
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "highlights" && (
            <div>
              {result.highlights?.length === 0 ? (
                <div
                  style={{
                    ...s.card,
                    textAlign: "center",
                    color: "rgba(255,255,255,0.3)",
                    fontSize: 13,
                  }}
                >
                  暂无突出亮点
                </div>
              ) : (
                result.highlights?.map((h, i) => (
                  <div key={i} style={{ ...s.card, borderLeft: "2px solid #34d399" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 7px",
                          borderRadius: 20,
                          background: "rgba(52,211,153,0.15)",
                          color: "#34d399",
                          fontWeight: 600,
                        }}
                      >
                        {DIMENSIONS.find((dim) => dim.id === h.dimension)?.label ?? h.dimension}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
                      {h.praise}
                    </div>
                    {h.line && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.35)",
                          background: "rgba(255,255,255,0.03)",
                          borderRadius: 6,
                          padding: "6px 10px",
                          fontStyle: "italic",
                        }}
                      >
                        「{h.line}」
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea:focus, input:focus { border-color: rgba(139,92,246,0.5) !important; }
        textarea::placeholder, input::placeholder { color: rgba(255,255,255,0.18); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
}
