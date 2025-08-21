<template>
  <el-row :gutter="16">
    <el-col :span="6">
      <el-card class="overview-card">
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-600">{{ totalProjects }}</div>
          <div class="text-gray-600 mt-2">掃描專案</div>
        </div>
      </el-card>
    </el-col>

    <el-col :span="6">
      <el-card class="overview-card">
        <div class="text-center">
          <div class="text-3xl font-bold text-orange-600">{{ totalOutdated }}</div>
          <div class="text-gray-600 mt-2">過期套件</div>
        </div>
      </el-card>
    </el-col>

    <el-col :span="6">
      <el-card class="overview-card">
        <div class="text-center">
          <div class="text-3xl font-bold text-red-600">{{ totalVulnerabilities }}</div>
          <div class="text-gray-600 mt-2">安全漏洞</div>
        </div>
      </el-card>
    </el-col>

    <el-col :span="6">
      <el-card class="overview-card">
        <div class="text-center">
          <div class="text-3xl font-bold text-green-600">{{ healthyProjects }}</div>
          <div class="text-gray-600 mt-2">健康專案</div>
        </div>
      </el-card>
    </el-col>
  </el-row>

  <!-- 安全漏洞嚴重程度分布 -->
  <el-card class="mt-6">
    <template #header>
      <h3 class="text-lg font-semibold">安全漏洞分布</h3>
    </template>

    <el-row :gutter="16">
      <el-col :span="6" v-for="(count, severity) in vulnerabilitySeverity" :key="severity">
        <div class="text-center p-4 rounded-lg" :class="getSeverityClass(severity)">
          <div class="text-2xl font-bold">{{ count }}</div>
          <div class="text-sm capitalize">{{ severity }}</div>
        </div>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ProjectScanResult } from '@/types/scanner';

interface Props {
  results: ProjectScanResult[];
}

const props = defineProps<Props>();

const totalProjects = computed(() => props.results.length);

const totalOutdated = computed(() =>
  props.results.reduce((sum, result) => sum + result.outdatedCount, 0)
);

const totalVulnerabilities = computed(() =>
  props.results.reduce((sum, result) => sum + result.vulnerabilityCount, 0)
);

const healthyProjects = computed(
  () =>
    props.results.filter(result => result.outdatedCount === 0 && result.vulnerabilityCount === 0)
      .length
);

const vulnerabilitySeverity = computed(() => {
  const severity = { critical: 0, high: 0, moderate: 0, low: 0 };

  props.results.forEach(result => {
    result.vulnerabilities.forEach(vuln => {
      if (vuln.severity in severity) {
        severity[vuln.severity as keyof typeof severity]++;
      }
    });
  });

  return severity;
});

const getSeverityClass = (severity: string) => {
  const classes = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
  };
  return classes[severity as keyof typeof classes] || 'bg-gray-100 text-gray-800';
};
</script>

<style scoped>
.overview-card {
  @apply border-0 shadow-md hover:shadow-lg transition-shadow;
}
</style>
