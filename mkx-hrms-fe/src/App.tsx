import { AuthProvider } from "contexts/AuthContext";
import { AppRoutes } from "routes";

/**
 * Root Application Component
 *
 * @returns The application wrapped with its routing and auth architecture
 */
const App = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

export default App;
