<template>
  <div class="glass p-4 mb-6">
    <h2 class="font-bold mb-2">داشبورد آماری</h2>
    <div class="flex gap-4 mb-4">
      <div class="flex flex-col items-center">
        <span class="text-2xl font-bold">{{ contacts.length }}</span>
        <span class="text-xs text-gray-500">تعداد کل مخاطبین</span>
      </div>
      <div class="flex flex-col items-center">
        <span class="text-2xl font-bold">{{ groups.length }}</span>
        <span class="text-xs text-gray-500">تعداد گروه‌ها</span>
      </div>
    </div>
    <canvas ref="chartRef" height="120"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import Chart from 'chart.js/auto'
const props = defineProps<{ contacts: any[], groups: any[] }>()
const chartRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const renderChart = () => {
  if (!chartRef.value) return
  if (chart) chart.destroy()
  const groupCounts = props.groups.map(g => ({
    name: g.name,
    count: props.contacts.filter(c => c.groupIds && c.groupIds.includes(g.id)).length
  }))
  chart = new Chart(chartRef.value, {
    type: 'bar',
    data: {
      labels: groupCounts.map(g => g.name),
      datasets: [{
        label: 'تعداد مخاطبین هر گروه',
        data: groupCounts.map(g => g.count),
        backgroundColor: 'rgba(59,130,246,0.5)'
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  })
}

onMounted(renderChart)
watch(() => [props.contacts, props.groups], renderChart, { deep: true })
</script> 