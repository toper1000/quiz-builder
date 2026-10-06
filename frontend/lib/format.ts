const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}
