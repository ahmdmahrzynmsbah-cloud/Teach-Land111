#!/bin/bash
sed -i '/enrolledStudents: number;/a \  enrolledStudentIds?: string[];' src/types.ts
cat << 'INNER_EOF' >> src/types.ts

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: 'enrollment' | 'system';
}
INNER_EOF
