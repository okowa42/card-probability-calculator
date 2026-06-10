let _id = 0;
export function uid(prefix: string = 'id'): string {
  return `${prefix}_${++_id}`;
}
