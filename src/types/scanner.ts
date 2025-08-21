export interface PackageInfo {
  name: string
  current: string
  wanted: string
  latest: string
  location: string
  type: 'dependencies' | 'devDependencies'
}

export interface SecurityVulnerability {
  name: string
  severity: 'low' | 'moderate' | 'high' | 'critical'
  via: string[]
  effects: string[]
  range: string
  nodes: string[]
  fixAvailable: boolean
}

export interface ProjectScanResult {
  projectName: string
  projectPath: string
  outdatedPackages: PackageInfo[]
  vulnerabilities: SecurityVulnerability[]
  scanTime: Date
  totalPackages: number
  outdatedCount: number
  vulnerabilityCount: number
}

export interface ScanProgress {
  current: number
  total: number
  currentProject: string
  status: 'scanning' | 'completed' | 'error'
}