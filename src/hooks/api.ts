import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboardOverview,
  fetchDellEndpoints,
  fetchIpamFindings,
  fetchIpamPrefixes,
  fetchJobs,
  fetchReportDefinitions,
  fetchReportExecutions,
  fetchSites,
  fetchVCenterInstances,
} from "@/lib/api";

export function useDashboardOverview() {
  return useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: fetchDashboardOverview,
    staleTime: 60_000,
  });
}

export function useVCenterInstances() {
  return useQuery({
    queryKey: ["vcenter-instances"],
    queryFn: fetchVCenterInstances,
    staleTime: 60_000,
  });
}

export function useDellEndpoints() {
  return useQuery({
    queryKey: ["dell-endpoints"],
    queryFn: fetchDellEndpoints,
    staleTime: 60_000,
  });
}

export function useIpamPrefixes() {
  return useQuery({
    queryKey: ["ipam-prefixes"],
    queryFn: fetchIpamPrefixes,
    staleTime: 60_000,
  });
}

export function useIpamFindings() {
  return useQuery({
    queryKey: ["ipam-findings"],
    queryFn: fetchIpamFindings,
    staleTime: 60_000,
  });
}

export function useJobs() {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobs,
    staleTime: 30_000,
  });
}

export function useReportDefinitions() {
  return useQuery({
    queryKey: ["report-definitions"],
    queryFn: fetchReportDefinitions,
    staleTime: 300_000,
  });
}

export function useReportExecutions() {
  return useQuery({
    queryKey: ["report-executions"],
    queryFn: fetchReportExecutions,
    staleTime: 30_000,
  });
}

export function useSites() {
  return useQuery({
    queryKey: ["sites"],
    queryFn: fetchSites,
    staleTime: 300_000,
  });
}
