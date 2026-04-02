interface CategoryNavProps {
  activeCategory: string | null;
}

const categories = [
  { key: 'informational', label: '1xx' },
  { key: 'success', label: '2xx' },
  { key: 'redirection', label: '3xx' },
  { key: 'client_error', label: '4xx' },
  { key: 'server_error', label: '5xx' },
];

export default function CategoryNav({ activeCategory }: CategoryNavProps) {
  const handleClick = (category: string) => {
    document
      .getElementById(`section-${category}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="category-nav" aria-label="Jump to category">
      {categories.map(({ key, label }) => (
        <button
          key={key}
          className={`category-nav-link${activeCategory === key ? ' active' : ''}`}
          onClick={() => handleClick(key)}
          aria-current={activeCategory === key ? 'true' : undefined}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
