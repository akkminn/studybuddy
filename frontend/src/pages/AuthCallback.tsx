import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * This page handles the redirect from Django after a successful Google login.
 * Django sends back JWT tokens as URL query parameters.
 * We extract them, save to localStorage, and redirect to /dashboard.
 */
export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");

    if (accessToken) {
      localStorage.setItem("jwt_token", accessToken);
      if (refreshToken) {
        localStorage.setItem("jwt_refresh_token", refreshToken);
      }
      // Redirect to dashboard now that the token is saved
      navigate("/dashboard", { replace: true });
    } else {
      console.error("No access token received from auth callback");
      navigate("/", { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center h-screen text-indigo-600 animate-pulse">
      Completing login...
    </div>
  );
}
