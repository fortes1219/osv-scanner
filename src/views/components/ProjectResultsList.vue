<template>
  <el-card>
    <template #header>
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">專案掃描結果</h3>

        <div class="flex gap-4">
          <el-select v-model="filterSeverity" placeholder="篩選嚴重程度" clearable class="w-40">
            <el-option label="Critical" value="critical" />
            <el-option label="High" value="high" />
            <el-option label="Moderate" value="moderate" />
            <el-option label="Low" value="low" />
          </el-select>

          <el-input v-model="searchText" placeholder="搜尋專案名稱" clearable class="w-60">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>
    </template>

    <el-table :data="filteredResults" stripe>
      <el-table-column prop="projectName" label="專案名稱" min-width="200">
        <template #default="{ row }">
          <div class="font-medium">{{ row.projectName }}</div>
          <div class="text-sm text-gray-500 truncate">{{ row.projectPath }}</div>
        </template>
      </el-table-column>

      <el-table-column prop="totalPackages" label="總套件數" width="100" align="center" />

      <el-table-column prop="outdatedCount" label="過期套件" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.outdatedCount > 0 ? 'warning' : 'success'" size="small">
            {{ row.outdatedCount }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="vulnerabilityCount" label="安全漏洞" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getVulnerabilityTagType(row.vulnerabilityCount)" size="small">
            {{ row.vulnerabilityCount }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="最高風險等級" width="120" align="center">
        <template #default="{ row }">
          <el-tag
            v-if="getHighestSeverity(row)"
            :type="getSeverityTagType(getHighestSeverity(row) ?? '')"
            size="small"
          >
            {{ getHighestSeverity(row) }}
          </el-tag>
          <span v-else class="text-gray-400">無</span>
        </template>
      </el-table-column>

      <el-table-column prop="scanTime" label="掃描時間" width="160">
        <template #default="{ row }">
          {{ formatTime(row.scanTime) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="viewDetails(row)"> 詳細 </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 詳細資訊對話框 -->
    <el-dialog
      v-model="detailVisible"
      :title="`${selectedProject?.projectName} - 詳細資訊`"
      width="80%"
      top="5vh"
    >
      <div v-if="selectedProject">
        <el-tabs>
          <el-tab-pane label="過期套件" :badge="selectedProject.outdatedCount.toString()">
            <el-table :data="selectedProject.outdatedPackages" max-height="400">
              <el-table-column prop="name" label="套件名稱" />
              <el-table-column prop="current" label="目前版本" width="120" />
              <el-table-column prop="wanted" label="期望版本" width="120" />
              <el-table-column prop="latest" label="最新版本" width="120" />
              <el-table-column prop="type" label="類型" width="120">
                <template #default="{ row }">
                  <el-tag :type="row.type === 'dependencies' ? 'primary' : 'info'" size="small">
                    {{ row.type === 'dependencies' ? '生產' : '開發' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="安全漏洞" :badge="selectedProject.vulnerabilityCount.toString()">
            <el-table :data="selectedProject.vulnerabilities" max-height="400">
              <el-table-column prop="name" label="套件名稱" />
              <el-table-column prop="severity" label="嚴重程度" width="100">
                <template #default="{ row }">
                  <el-tag :type="getSeverityTagType(row.severity)" size="small">
                    {{ row.severity }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="range" label="影響版本" width="150" />
              <el-table-column prop="fixAvailable" label="可修復" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.fixAvailable ? 'success' : 'danger'" size="small">
                    {{ row.fixAvailable ? '是' : '否' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Search } from '@element-plus/icons-vue';
import type { ProjectScanResult } from '@/types/scanner';

interface Props {
  results: ProjectScanResult[];
}

const props = defineProps<Props>();

const searchText = ref('');
const filterSeverity = ref<string>('');
const detailVisible = ref(false);
const selectedProject = ref<ProjectScanResult | null>(null);

const filteredResults = computed(() => {
  let filtered = props.results;

  if (searchText.value) {
    filtered = filtered.filter(result =>
      result.projectName.toLowerCase().includes(searchText.value.toLowerCase())
    );
  }

  if (filterSeverity.value) {
    filtered = filtered.filter(result =>
      result.vulnerabilities.some(vuln => vuln.severity === filterSeverity.value)
    );
  }

  return filtered;
});

const getVulnerabilityTagType = (count: number) => {
  if (count === 0) return 'success';
  if (count < 5) return 'warning';
  return 'danger';
};

const getSeverityTagType = (severity: string) => {
  const types = {
    critical: 'danger',
    high: 'danger',
    moderate: 'warning',
    low: 'info'
  };
  return types[severity as keyof typeof types] || 'info';
};

const getHighestSeverity = (project: ProjectScanResult) => {
  if (project.vulnerabilities.length === 0) return null;

  const severityOrder = ['critical', 'high', 'moderate', 'low'];

  for (const severity of severityOrder) {
    if (project.vulnerabilities.some(vuln => vuln.severity === severity)) {
      return severity;
    }
  }

  return null;
};

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

const viewDetails = (project: ProjectScanResult) => {
  selectedProject.value = project;
  detailVisible.value = true;
};
</script>
