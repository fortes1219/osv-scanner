import type { PackageInfo, SecurityVulnerability, ProjectScanResult } from '@/types/scanner'

interface PackageJson {
  name?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

interface OSVVulnerability {
  id: string
  summary?: string
  details?: string
  aliases?: string[]
  severity?: Array<{
    type: string
    score: string
  }>
  affected?: Array<{
    package: {
      ecosystem: string
      name: string
    }
    ranges?: Array<{
      type: string
      events: Array<{
        introduced?: string
        fixed?: string
      }>
    }>
  }>
}

// File System Access API type declarations
declare global {
  interface Window {
    showDirectoryPicker(options?: {
      mode?: 'read' | 'readwrite'
    }): Promise<FileSystemDirectoryHandle>
  }

  interface FileSystemHandle {
    readonly name: string
    readonly kind: 'file' | 'directory'
  }

  interface FileSystemDirectoryHandle extends FileSystemHandle {
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>
    getFileHandle(name: string): Promise<FileSystemFileHandle>
    getDirectoryHandle(name: string): Promise<FileSystemDirectoryHandle>
    readonly kind: 'directory'
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    getFile(): Promise<File>
    readonly kind: 'file'
  }
}

export async function selectDirectory(): Promise<FileSystemDirectoryHandle | null> {
  try {
    // 使用現代瀏覽器的 File System Access API
    const dirHandle = await window.showDirectoryPicker({
      mode: 'read'
    })
    return dirHandle
  } catch (error) {
    console.log('用戶取消選擇目錄', error)
    return null
  }
}

export async function findProjects(rootHandle: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle[]> {
  const projects: FileSystemDirectoryHandle[] = []

  async function scanDirectory(dirHandle: FileSystemDirectoryHandle, depth = 0) {
    // 避免掃描太深
    if (depth > 3) return

    try {
      // 檢查是否有 package.json
      const packageJsonHandle = await dirHandle.getFileHandle('package.json')
      if (packageJsonHandle) {
        projects.push(dirHandle)
      }
    } catch {
      // 沒有 package.json，繼續掃描子目錄
    }

    // 掃描子目錄
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind === 'directory' &&
        !name.startsWith('.') &&
        name !== 'node_modules' &&
        name !== 'dist' &&
        name !== 'build') {
        await scanDirectory(handle as FileSystemDirectoryHandle, depth + 1)
      }
    }
  }

  await scanDirectory(rootHandle)
  return projects
}

export async function scanProject(projectHandle: FileSystemDirectoryHandle): Promise<ProjectScanResult> {
  // 讀取 package.json
  const packageJsonHandle = await projectHandle.getFileHandle('package.json')
  const packageJsonFile = await packageJsonHandle.getFile()
  const packageJsonText = await packageJsonFile.text()
  const packageJson: PackageJson = JSON.parse(packageJsonText)

  // 獲取所有依賴
  const allDependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  }

  // 檢查過期套件（使用 npm registry API）
  const outdatedPackages = await checkOutdatedPackages(allDependencies)

  // 檢查安全漏洞（使用公開的漏洞資料庫）
  const vulnerabilities = await checkVulnerabilities(allDependencies)

  return {
    projectName: packageJson.name || projectHandle.name,
    projectPath: projectHandle.name,
    outdatedPackages,
    vulnerabilities,
    scanTime: new Date(),
    totalPackages: Object.keys(allDependencies).length,
    outdatedCount: outdatedPackages.length,
    vulnerabilityCount: vulnerabilities.length
  }
}

async function checkOutdatedPackages(dependencies: Record<string, string>): Promise<PackageInfo[]> {
  const outdatedPackages: PackageInfo[] = []

  // 批次檢查套件版本
  const packageNames = Object.keys(dependencies)

  for (const packageName of packageNames) {
    try {
      const currentVersion = dependencies[packageName].replace(/[\^~>=<]/, '')
      const registryUrl = `https://registry.npmjs.org/${packageName}/latest`

      const response = await fetch(registryUrl)
      if (!response.ok) continue

      const data = await response.json()
      const latestVersion = data.version

      // 簡單的版本比較（可以後續改用 semver 庫）
      if (compareVersions(currentVersion, latestVersion) < 0) {
        outdatedPackages.push({
          name: packageName,
          current: currentVersion,
          wanted: latestVersion, // 簡化，實際上應該根據 semver 範圍計算
          latest: latestVersion,
          location: '',
          type: packageName in (dependencies || {}) ? 'dependencies' : 'devDependencies'
        })
      }
    } catch (error) {
      console.warn(`檢查套件 ${packageName} 失敗:`, error)
    }
  }

  return outdatedPackages
}

// OSV API endpoint
const OSV_API = 'https://api.osv.dev/v1/query'

type Severity = 'low' | 'moderate' | 'high' | 'critical'

/** 將 CVSS 分數轉成簡單等級 */
function cvssToSeverity(score?: string): Severity {
  const value = Number(score ?? 0)
  if (value >= 9) return 'critical'
  if (value >= 7) return 'high'
  if (value >= 4) return 'moderate'
  return 'low'
}

/** 送出單一套件查詢，失敗或無資料時回傳空陣列 */
async function queryOSV(packageName: string) {
  const res = await fetch(OSV_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      package: { name: packageName, ecosystem: 'npm' }
    })
  }).catch(() => null)

  if (!res?.ok) return []                                // 早退 ─ 無回覆或 HTTP 錯誤

  const data = await res.json().catch(() => ({}))
  return Array.isArray(data.vulns) ? data.vulns as OSVVulnerability[] : []
}

export async function checkVulnerabilities(
  dependencies: Record<string, string>
): Promise<SecurityVulnerability[]> {
  // 建立「套件 → Promise<OSVVulnerability[]>」的併發查詢映射
  const queries = Object.keys(dependencies).map(async pkg => {
    const vulns = await queryOSV(pkg)
    if (vulns.length === 0) return []                    // 早退 ─ 沒漏洞

    return vulns.map(vuln => {
      const score = vuln.severity?.[0]?.score            // 取第一個 CVSS
      return <SecurityVulnerability>{
        name: pkg,
        severity: cvssToSeverity(score),
        via: vuln.aliases ?? [],
        effects: [pkg],
        range: dependencies[pkg],
        nodes: [pkg],
        fixAvailable: true                               // 簡化：真實情況應再判斷
      }
    })
  })

  // 等待所有查詢完成並攤平成單一陣列
  const results = await Promise.all(queries)
  return results.flat()
}

// 簡單的版本比較函數
function compareVersions(version1: string, version2: string): number {
  const v1parts = version1.split('.').map(Number)
  const v2parts = version2.split('.').map(Number)

  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0
    const v2part = v2parts[i] || 0

    if (v1part < v2part) return -1
    if (v1part > v2part) return 1
  }

  return 0
}