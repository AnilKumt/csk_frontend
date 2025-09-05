import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const AuthRedirect = () => {
  const { isUnauthorized, setIsUnauthorized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isUnauthorized) {
      setIsUnauthorized(false);
      navigate("/login", { replace: true });
    }
  }, [isUnauthorized, navigate, setIsUnauthorized]);

  return null;
};

export default AuthRedirect;
