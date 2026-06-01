<template>
  <div class="database-page">
    <div class="page-header">
      <h3>信息库</h3>
      <el-button type="primary" @click="handleExport">
        <el-icon><Download /></el-icon> 导出数据
      </el-button>
    </div>

    <el-tabs v-model="activeTab">
      <!-- 学生信息库 -->
      <el-tab-pane label="学生信息" name="students">
        <div class="filter-bar">
          <el-input
            v-model="studentSearch"
            placeholder="搜索姓名/学号/专业"
            prefix-icon="Search"
            clearable
            style="width: 300px"
          />
          <el-select v-model="skillFilter" placeholder="按技能筛选" clearable style="width: 200px">
            <el-option v-for="skill in skillOptions" :key="skill" :label="skill" :value="skill" />
          </el-select>
          <el-select v-model="personalityFilter" placeholder="按性格筛选" clearable style="width: 200px">
            <el-option v-for="p in personalityOptions" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </div>
        <el-table :data="filteredStudents" border stripe style="width: 100%">
          <el-table-column prop="name" label="姓名" width="80" />
          <el-table-column prop="studentId" label="学号" width="100" />
          <el-table-column prop="major" label="专业" width="150" />
          <el-table-column prop="grade" label="年级" width="70" />
          <el-table-column label="技能" min-width="200">
            <template #default="{ row }">
              <el-tag v-for="s in row.skills" :key="s" size="small" class="tag" type="primary">{{ s }}</el-tag>
              <span v-if="!row.skills.length" class="text-muted">未设置</span>
            </template>
          </el-table-column>
          <el-table-column label="性格" width="120">
            <template #default="{ row }">
              {{ getPersonalityLabel(row.personality) }}
            </template>
          </el-table-column>
          <el-table-column label="评分" width="80">
            <template #default="{ row }">
              <el-tag :type="getRatingType(store.getStudentRating(row.id))">
                {{ store.getStudentRating(row.id) || '暂无' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
        <div class="table-footer">
          共 {{ filteredStudents.length }} 条记录
        </div>
      </el-tab-pane>

      <!-- 课堂信息库 -->
      <el-tab-pane label="课堂信息" name="classrooms">
        <el-table :data="store.classrooms" border stripe style="width: 100%">
          <el-table-column prop="name" label="课堂名称" width="180" />
          <el-table-column prop="teacher" label="教师" width="100" />
          <el-table-column prop="description" label="描述" min-width="200" />
          <el-table-column prop="maxTeamSize" label="队伍上限" width="90" />
          <el-table-column label="学生数" width="80">
            <template #default="{ row }">
              {{ row.students.length }}
            </template>
          </el-table-column>
          <el-table-column label="时间" width="200">
            <template #default="{ row }">
              {{ row.startDate }} ~ {{ row.endDate }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                {{ row.status === 'active' ? '进行中' : '已结束' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
        <div class="table-footer">
          共 {{ store.classrooms.length }} 条记录
        </div>
      </el-tab-pane>

      <!-- 队伍信息库 -->
      <el-tab-pane label="队伍信息" name="teams">
        <el-table :data="store.teams" border stripe style="width: 100%">
          <el-table-column prop="name" label="队伍名称" width="160" />
          <el-table-column label="所属课堂" width="180">
            <template #default="{ row }">
              {{ getClassroomName(row.classroomId) }}
            </template>
          </el-table-column>
          <el-table-column label="队长" width="80">
            <template #default="{ row }">
              {{ getStudentName(row.leader) }}
            </template>
          </el-table-column>
          <el-table-column label="成员" min-width="250">
            <template #default="{ row }">
              <el-tag v-for="mid in row.members" :key="mid" size="small" class="tag" type="primary">
                {{ getStudentName(mid) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="人数" width="70">
            <template #default="{ row }">
              {{ row.members.length }}人
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="120" />
        </el-table>
        <div class="table-footer">
          共 {{ store.teams.length }} 条记录
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../store'
import { skillOptions, personalityOptions } from '../data/mockData'
import { ElMessage } from 'element-plus'

const store = useAppStore()
const activeTab = ref('students')

const studentSearch = ref('')
const skillFilter = ref('')
const personalityFilter = ref('')

const filteredStudents = computed(() => {
  let result = store.students
  if (studentSearch.value) {
    const keyword = studentSearch.value.toLowerCase()
    result = result.filter(s =>
      s.name.toLowerCase().includes(keyword) ||
      s.studentId.toLowerCase().includes(keyword) ||
      s.major.toLowerCase().includes(keyword)
    )
  }
  if (skillFilter.value) {
    result = result.filter(s => s.skills.includes(skillFilter.value))
  }
  if (personalityFilter.value) {
    result = result.filter(s => s.personality === personalityFilter.value)
  }
  return result
})

function getPersonalityLabel(value) {
  const opt = personalityOptions.find(p => p.value === value)
  return opt ? opt.label.split(' - ')[0] : '未设置'
}

function getStudentName(id) {
  const s = store.students.find(s => s.id === id)
  return s ? s.name : '未知'
}

function getClassroomName(id) {
  const c = store.classrooms.find(c => c.id === id)
  return c ? c.name : '未知'
}

function getRatingType(rating) {
  if (!rating) return 'info'
  if (rating >= 4) return 'success'
  if (rating >= 3) return 'warning'
  return 'danger'
}

function handleExport() {
  ElMessage.success('数据导出成功（演示功能）')
}
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-header h3 {
  font-size: 20px;
  color: #333;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.tag {
  margin: 2px 4px;
}

.text-muted {
  color: #999;
  font-size: 13px;
}

.table-footer {
  margin-top: 12px;
  text-align: right;
  color: #999;
  font-size: 13px;
}
</style>
