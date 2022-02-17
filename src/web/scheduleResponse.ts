export interface ScheduleDto {
  id: string
  org_id: string
  class_roster_class_id: string
  class_roster_teacher_ids: ReadonlyArray<string>
  participant_teacher_ids: ReadonlyArray<string>
}
