import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRefresh = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            backgroundColor: "#f9f9f9",
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h1 style={{ color: "#ff0000", marginBottom: "20px" }}>
            Something went wrong
          </h1>
          <p style={{ marginBottom: "20px", color: "#606060" }}>
            {this.state.error && this.state.error.toString()}
          </p>
          <button
            onClick={this.handleRefresh}
            style={{
              padding: "12px 24px",
              background: "#065fd4",
              color: "white",
              border: "none",
              borderRadius: "20px",
              fontSize: "16px",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.background = "#0347a4")}
            onMouseOut={(e) => (e.target.style.background = "#065fd4")}
          >
            Go Back to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
