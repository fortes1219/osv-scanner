<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-7xl mx-auto">
      <el-card class="mb-6">
        <template #header>
          <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold text-gray-800">套件掃描工具</h1>
            <el-button
              type="primary"
              @click="startScan"
              :loading="isScanning"
              :disabled="!rootHandle"
            >
              {{ isScanning ? '掃描中...' : '開始掃描' }}
            </el-button>
          </div>
        </template>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> 選擇專案根目錄 </label>
            <div class="flex gap-4">
              <el-button type="primary" @click="selectProjectDirectory" class="w-full">
                {{ rootHandle ? `已選擇: ${rootHandle.name}` : '選擇目錄' }}
              </el-button>
            </div>
          </div>

          <div v-if="isScanning" class="space-y-2">
            <el-progress :percentage="scanProgress.percentage" :status="scanProgress.status" />
            <p class="text-sm text-gray-600">
              正在掃描: {{ scanProgress.currentProject }} ({{ scanProgress.current }}/{{
                scanProgress.total
              }})
            </p>
          </div>
        </div>
      </el-card>

      <!-- 掃描結果 -->
      <div v-if="scanResults.length > 0">
        <ScanResultsOverview :results="scanResults" class="mb-6" />
        <ProjectResultsList :results="scanResults" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useMutation } from '@tanstack/vue-query';
import { ElMessage } from 'element-plus';
import { selectDirectory, findProjects, scanProject } from '@/utils/packageScanner';
import ScanResultsOverview from './components/ScanResultsOverview.vue';
import ProjectResultsList from './components/ProjectResultsList.vue';
import type { ProjectScanResult } from '@/types/scanner';

const rootHandle = ref<FileSystemDirectoryHandle | null>(null);
const isScanning = ref(false);
const scanResults = ref<ProjectScanResult[]>([]);

const scanProgress = reactive({
  current: 0,
  total: 0,
  currentProject: '',
  percentage: 0,
  status: 'success' as const
});

const { mutate: performScan } = useMutation({
  mutationFn: async (handle: FileSystemDirectoryHandle) => {
    const projectHandles = await findProjects(handle);
    const results: ProjectScanResult[] = [];

    scanProgress.total = projectHandles.length;
    scanProgress.current = 0;

    for (const projectHandle of projectHandles) {
      scanProgress.current++;
      scanProgress.currentProject = projectHandle.name;
      scanProgress.percentage = Math.round((scanProgress.current / scanProgress.total) * 100);

      try {
        const result = await scanProject(projectHandle);
        results.push(result);
      } catch (error) {
        console.error(`掃描專案失敗: ${projectHandle.name}`, error);
      }
    }

    return results;
  },
  onMutate: () => {
    isScanning.value = true;
  },
  onSuccess: results => {
    scanResults.value = results;
    ElMessage.success(`掃描完成！共掃描 ${results.length} 個專案`);
  },
  onError: error => {
    ElMessage.error(`掃描失敗: ${error.message}`);
  },
  onSettled: () => {
    isScanning.value = false;
  }
});

const startScan = () => {
  if (!rootHandle.value) {
    ElMessage.warning('請先選擇專案根目錄');
    return;
  }
  performScan(rootHandle.value);
};

const selectProjectDirectory = async () => {
  const handle = await selectDirectory();
  if (handle) {
    rootHandle.value = handle;
    ElMessage.success(`已選擇目錄: ${handle.name}`);
  }
};
</script>
