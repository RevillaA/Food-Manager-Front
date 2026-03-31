import { AuthenticatedUser } from './authenticated-user.interface';

export interface LoginResponseData {
  token: string;
  user: AuthenticatedUser;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: LoginResponseData;
}