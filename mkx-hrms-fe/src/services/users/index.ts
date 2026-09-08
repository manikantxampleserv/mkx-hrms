import { useCustomQuery } from "hooks/useCustomQuery";
import { useCustomMutation } from "hooks/useCustomMutation";

export interface User {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string | null;
  role_id: number | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to fetch the list of users from the API
 */
export const useGetUsers = () => {
  return useCustomQuery<User[]>(["users"], "/v1/users");
};

/**
 * Hook to trigger a manual reload of users (dummy mutation for demonstration)
 */
export const useReloadUsers = (onSuccessCallback?: () => void) => {
  return useCustomMutation({
    onSuccess: () => {
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
  });
};
