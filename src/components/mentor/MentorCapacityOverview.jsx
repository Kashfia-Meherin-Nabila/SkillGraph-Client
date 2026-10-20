
"use client";

export default function MentorCapacityOverview({
  capacity = 15,
  activeMentees = 0,
  remainingSlots = 0,
}) {
  const percentage =
    capacity > 0
      ? Math.min(100, (activeMentees / capacity) * 100)
      : 0;

  const stats = [
    {
      label: "Total Developer Limit",
      value: capacity,
      description: "Maximum developers you can mentor",
      icon: "👥",
    },
    {
      label: "Active Developers",
      value: activeMentees,
      description: "Approved mentorships",
      icon: "🟢",
    },
    {
      label: "Remaining Slots",
      value: remainingSlots,
      description: "Available mentorship slots",
      icon: "🎯",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>
              <span className="text-2xl">{stat.icon}</span>
            </div>

            <p className="mt-4 text-4xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </p>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {stat.description}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Developer Capacity
          </h2>

          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {activeMentees} / {capacity}
          </span>
        </div>

        <div
          className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700"
          role="progressbar"
          aria-label="Developer capacity used"
          aria-valuemin={0}
          aria-valuemax={capacity}
          aria-valuenow={activeMentees}
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              percentage >= 100 ? "bg-red-500" : "bg-indigo-600"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          {remainingSlots === 0
            ? "Your mentoring capacity is full."
            : `You can accept ${remainingSlots} more ${
                remainingSlots === 1 ? "developer" : "developers"
              }.`}
        </p>
      </div>
    </section>
  );
}
