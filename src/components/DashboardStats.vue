// ===== TEMPLATE =====
<template>
  <div class="glass p-4 mb-6">
    <h2 class="font-bold mb-4 text-lg">آمار مخاطبین</h2>

    <div v-if="isLoading" class="text-center py-10">
      <span class="loading loading-spinner loading-lg"></span>
      <p class="mt-2">در حال بارگذاری آمار...</p>
    </div>

    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="stat bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div class="stat-figure text-primary">
            <span class="iconify h-8 w-8" data-icon="lucide:users"></span>
          </div>
          <div class="stat-title">تعداد کل مخاطبین</div>
          <div class="stat-value text-primary">{{ contacts.length }}</div>
        </div>

        <div class="stat bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div class="stat-figure text-secondary">
            <span class="iconify h-8 w-8" data-icon="lucide:folder"></span>
          </div>
          <div class="stat-title">تعداد گروه‌ها</div>
          <div class="stat-value text-secondary">{{ groups.length }}</div>
        </div>

        <div class="stat bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div class="stat-figure text-accent">
            <span class="iconify h-8 w-8" data-icon="lucide:user-plus"></span>
          </div>
          <div class="stat-title">مخاطبین جدید (هفته اخیر)</div>
          <div class="stat-value text-accent text-2xl">{{ recentContactsCount }}</div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <h3 class="font-semibold mb-4">توزیع مخاطبین در گروه‌ها</h3>
        <div v-if="chartData.labels.length > 0" class="h-64">
          <canvas ref="chartRef"></canvas>
        </div>
        <p v-else class="text-center text-gray-500 py-8">داده‌ای برای نمایش نمودار وجود ندارد.</p>
      </div>
    </div>
  </div>
</template>

// ===== SCRIPT =====
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import Chart from 'chart.js/auto';
import type { Chart as ChartType, ChartConfiguration } from 'chart.js';
import type { Contact } from '@/types/supabase';
import type { Group } from '@/stores/groupsStore';
import type { PropType } from 'vue';

const props = defineProps({
  contacts: {
    type: Array as PropType<Contact[]>,
    required: true,
  },
  groups: {
    type: Array as PropType<Group[]>,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
});

const chartRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: ChartType | null = null;

/**
 * Efficiently calculates the number of contacts per group.
 * This is a computed property, so it only recalculates when contacts or groups change.
 */
const chartData = computed(() => {
  if (!props.groups.length || !props.contacts.length) {
    return { labels: [], data: [], colors: [] };
  }

  // Create a map for group counts for O(1) updates.
  const groupCountMap = new Map<string, number>();
  props.groups.forEach((group) => groupCountMap.set(group.id, 0));

  // Iterate through contacts once to populate the counts.
  props.contacts.forEach((contact) => {
    if (contact.groupIds) {
      contact.groupIds.forEach((groupId) => {
        if (groupCountMap.has(groupId)) {
          groupCountMap.set(groupId, (groupCountMap.get(groupId) || 0) + 1);
        }
      });
    }
  });

  // Filter out groups with zero contacts for a cleaner chart
  const filteredGroups = props.groups.filter((group) => (groupCountMap.get(group.id) || 0) > 0);

  return {
    labels: filteredGroups.map((g) => g.name),
    data: filteredGroups.map((g) => groupCountMap.get(g.id) || 0),
    colors: filteredGroups.map((g) => g.color || '#cccccc'),
  };
});

/**
 * Calculates the number of contacts added in the last 7 days.
 */
const recentContactsCount = computed(() => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return props.contacts.filter((contact) => {
    const createdAt = contact.createdAt ? new Date(contact.createdAt) : null;
    return createdAt && createdAt >= oneWeekAgo;
  }).length;
});

const renderChart = () => {
  if (!chartRef.value || !chartData.value.labels.length) {
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    return;
  }

  if (chartInstance) {
    chartInstance.destroy();
  }

  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: chartData.value.labels,
      datasets: [
        {
          label: 'تعداد مخاطبین',
          data: chartData.value.data,
          backgroundColor: chartData.value.colors.map((color) => `${color}B3`), // 70% opacity
          borderColor: chartData.value.colors,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          titleFont: { family: 'Vazirmatn' },
          bodyFont: { family: 'Vazirmatn' },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: { family: 'Vazirmatn' },
          },
        },
        x: {
          ticks: {
            font: { family: 'Vazirmatn' },
          },
        },
      },
    },
  };

  chartInstance = new Chart(chartRef.value, config);
};

// Watch for changes in the computed chartData and re-render the chart.
// This is more efficient than a deep watch on the props.
watch(
  chartData,
  () => {
    renderChart();
  },
  { immediate: true }
);

onMounted(() => {
  window.addEventListener('resize', renderChart);
});

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy();
  }
  window.removeEventListener('resize', renderChart);
});
</script>

// ===== STYLE =====
<style scoped>
.stat {
  @apply flex flex-col items-center text-center p-4 rounded-lg;
}
.stat-figure {
  @apply mb-2;
}
.stat-title {
  @apply text-sm text-gray-500 dark:text-gray-400;
}
.stat-value {
  @apply text-2xl font-bold;
}
</style>
