import React from "react";

const AppLoader = () => {
  const metrics = [
    { label: "Catchment", value: "82%" },
    { label: "ROI", value: "4.6x" },
    { label: "Decision", value: "Live" },
  ];

  return (
    <div style={styles.screen} role='status' aria-live='polite'>
      <style>{loaderKeyframes}</style>
      <div style={styles.orbitPanel}>
        <span style={styles.orbitDotOne} />
        <span style={styles.orbitDotTwo} />
        <span style={styles.orbitDotThree} />
        <div style={styles.coreCard}>
          <div style={styles.brandRow}>
            <span style={styles.brandMark}>TE</span>
            <span style={styles.brandName}>THIRD EYE ROI</span>
          </div>

          <div style={styles.signalWrap}>
            <div style={styles.ringOuter} />
            <div style={styles.ringInner} />
            <div style={styles.chartBars}>
              <span style={{ ...styles.chartBar, height: "34%" }} />
              <span style={{ ...styles.chartBar, height: "58%" }} />
              <span style={{ ...styles.chartBar, height: "76%" }} />
              <span style={{ ...styles.chartBar, height: "48%" }} />
            </div>
          </div>

          <div style={styles.contentBlock}>
            <p style={styles.eyebrow}>Analytics engine is warming up</p>
            <h1 style={styles.title}>Decision intelligence loading...</h1>
            <p style={styles.description}>
              Aligning store potential, catchment strength, and ROI signals for
              the next view.
            </p>
          </div>

          <div style={styles.metricGrid}>
            {metrics.map((metric) => (
              <div style={styles.metricCard} key={metric.label}>
                <span style={styles.metricValue}>{metric.value}</span>
                <span style={styles.metricLabel}>{metric.label}</span>
              </div>
            ))}
          </div>

          <div style={styles.progressTrack}>
            <span style={styles.progressFill} />
          </div>
        </div>
      </div>
    </div>
  );
};

const sidebarColor = "#233044";
const sidebarAccent = "#87cefa";

const styles = {
  screen: {
    position: "fixed",
    inset: 0,
    zIndex: 99999,
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px",
    background:
      "radial-gradient(circle at 24% 18%, rgba(135, 206, 250, 0.24), transparent 28%), linear-gradient(135deg, #172233 0%, #233044 46%, #101827 100%)",
    color: "#ffffff",
    boxSizing: "border-box",
  },
  orbitPanel: {
    position: "relative",
    width: "min(92vw, 460px)",
    minHeight: "430px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  orbitDotOne: {
    position: "absolute",
    top: "8%",
    right: "12%",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: sidebarAccent,
    boxShadow: "0 0 26px rgba(135, 206, 250, 0.95)",
    animation: "appLoaderFloat 2.8s ease-in-out infinite",
  },
  orbitDotTwo: {
    position: "absolute",
    bottom: "12%",
    left: "10%",
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#ffffff",
    opacity: 0.75,
    animation: "appLoaderFloat 3.2s ease-in-out infinite reverse",
  },
  orbitDotThree: {
    position: "absolute",
    top: "46%",
    left: "1%",
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#9ee7ff",
    animation: "appLoaderPulse 1.8s ease-in-out infinite",
  },
  coreCard: {
    position: "relative",
    width: "100%",
    padding: "26px",
    border: "1px solid rgba(135, 206, 250, 0.28)",
    borderRadius: "8px",
    background: "rgba(255, 255, 255, 0.08)",
    boxShadow: "0 30px 80px rgba(0, 0, 0, 0.36)",
    backdropFilter: "blur(18px)",
    boxSizing: "border-box",
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  },
  brandMark: {
    width: "36px",
    height: "36px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px",
    background: sidebarAccent,
    color: sidebarColor,
    fontWeight: 800,
    letterSpacing: "0",
  },
  brandName: {
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "rgba(255, 255, 255, 0.82)",
  },
  signalWrap: {
    position: "relative",
    width: "124px",
    height: "124px",
    margin: "0 auto 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  ringOuter: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    border: "2px solid rgba(255, 255, 255, 0.14)",
    borderTopColor: sidebarAccent,
    borderRightColor: sidebarAccent,
    animation: "appLoaderSpin 1.8s linear infinite",
  },
  ringInner: {
    position: "absolute",
    inset: "18px",
    borderRadius: "50%",
    border: "1px solid rgba(135, 206, 250, 0.28)",
    animation: "appLoaderPulse 1.9s ease-in-out infinite",
  },
  chartBars: {
    width: "62px",
    height: "58px",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: "7px",
    padding: "10px",
    borderRadius: "8px",
    background: "rgba(16, 24, 39, 0.52)",
  },
  chartBar: {
    width: "8px",
    borderRadius: "8px 8px 2px 2px",
    background: "linear-gradient(180deg, #ffffff 0%, #87cefa 100%)",
    animation: "appLoaderBar 1.2s ease-in-out infinite alternate",
  },
  contentBlock: {
    textAlign: "center",
  },
  eyebrow: {
    margin: "0 0 8px",
    color: sidebarAccent,
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },
  title: {
    margin: 0,
    fontSize: "clamp(22px, 5vw, 27px)",
    lineHeight: 1.14,
    fontWeight: 800,
    letterSpacing: "0",
  },
  description: {
    maxWidth: "340px",
    margin: "10px auto 0",
    color: "rgba(255, 255, 255, 0.74)",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  metricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "8px",
    marginTop: "18px",
  },
  metricCard: {
    padding: "10px 8px",
    borderRadius: "6px",
    background: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    textAlign: "center",
  },
  metricValue: {
    display: "block",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "15px",
  },
  metricLabel: {
    display: "block",
    marginTop: "4px",
    color: "rgba(255, 255, 255, 0.62)",
    fontSize: "11px",
  },
  progressTrack: {
    position: "relative",
    height: "4px",
    marginTop: "18px",
    overflow: "hidden",
    borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.12)",
  },
  progressFill: {
    position: "absolute",
    inset: 0,
    width: "42%",
    borderRadius: "inherit",
    background: "linear-gradient(90deg, #ffffff 0%, #87cefa 100%)",
    animation: "appLoaderProgress 1.4s ease-in-out infinite",
  },
};

const loaderKeyframes = `
  @keyframes appLoaderSpin {
    to { transform: rotate(360deg); }
  }

  @keyframes appLoaderPulse {
    0%, 100% { opacity: 0.45; transform: scale(0.94); }
    50% { opacity: 1; transform: scale(1); }
  }

  @keyframes appLoaderFloat {
    0%, 100% { transform: translate3d(0, 0, 0); }
    50% { transform: translate3d(0, -14px, 0); }
  }

  @keyframes appLoaderBar {
    from { transform: scaleY(0.72); opacity: 0.68; }
    to { transform: scaleY(1); opacity: 1; }
  }

  @keyframes appLoaderProgress {
    0% { transform: translateX(-110%); }
    55%, 100% { transform: translateX(240%); }
  }

  @media (max-width: 520px) {
    [role='status'] { padding: 16px !important; }
  }
`;

export default AppLoader;
