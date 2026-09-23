import request from './request'
import type { ApiResponse } from './request'
import type { LoginDto, RegisterDto, UserInfo } from '@shared/types'

export type AuthPayload = { token: string; user: UserInfo }

export function register(data: RegisterDto) {
  return request.post<ApiResponse<AuthPayload>>('/user/register', data)
}

export function login(data: LoginDto) {
  return request.post<ApiResponse<AuthPayload>>('/user/login', data)
}

export function getCurrentUser() {
  return request.get<ApiResponse<UserInfo>>('/user/me')
}
