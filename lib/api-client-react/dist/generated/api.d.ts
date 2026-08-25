import type { QueryKey, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { HealthStatus, JudicialCase, JudicialCaseDetail, JudicialDashboard } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: Parameters<typeof customFetch>[1]) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetJudicialDashboardUrl: () => string;
/**
 * @summary Get the judicial workbench dashboard
 */
export declare const getJudicialDashboard: (options?: Parameters<typeof customFetch>[1]) => Promise<JudicialDashboard>;
export declare const getGetJudicialDashboardQueryKey: () => readonly ["/api/judicial/dashboard"];
export declare const getGetJudicialDashboardQueryOptions: <TData = Awaited<ReturnType<typeof getJudicialDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getJudicialDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getJudicialDashboard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetJudicialDashboardQueryResult = NonNullable<Awaited<ReturnType<typeof getJudicialDashboard>>>;
export type GetJudicialDashboardQueryError = ErrorType<unknown>;
/**
 * @summary Get the judicial workbench dashboard
 */
export declare function useGetJudicialDashboard<TData = Awaited<ReturnType<typeof getJudicialDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getJudicialDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetJudicialCasesUrl: () => string;
/**
 * @summary List authorized cases
 */
export declare const getJudicialCases: (options?: Parameters<typeof customFetch>[1]) => Promise<JudicialCase[]>;
export declare const getGetJudicialCasesQueryKey: () => readonly ["/api/judicial/cases"];
export declare const getGetJudicialCasesQueryOptions: <TData = Awaited<ReturnType<typeof getJudicialCases>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getJudicialCases>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getJudicialCases>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetJudicialCasesQueryResult = NonNullable<Awaited<ReturnType<typeof getJudicialCases>>>;
export type GetJudicialCasesQueryError = ErrorType<unknown>;
/**
 * @summary List authorized cases
 */
export declare function useGetJudicialCases<TData = Awaited<ReturnType<typeof getJudicialCases>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getJudicialCases>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetJudicialCaseUrl: (caseId: string) => string;
/**
 * @summary Get a case workbench
 */
export declare const getJudicialCase: (caseId: string, options?: Parameters<typeof customFetch>[1]) => Promise<JudicialCaseDetail>;
export declare const getGetJudicialCaseQueryKey: (caseId: string) => readonly [`/api/judicial/cases/${string}`];
export declare const getGetJudicialCaseQueryOptions: <TData = Awaited<ReturnType<typeof getJudicialCase>>, TError = ErrorType<unknown>>(caseId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getJudicialCase>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getJudicialCase>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetJudicialCaseQueryResult = NonNullable<Awaited<ReturnType<typeof getJudicialCase>>>;
export type GetJudicialCaseQueryError = ErrorType<unknown>;
/**
 * @summary Get a case workbench
 */
export declare function useGetJudicialCase<TData = Awaited<ReturnType<typeof getJudicialCase>>, TError = ErrorType<unknown>>(caseId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getJudicialCase>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map