
"use client";

function formatDate(date) {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ApprovedDevelopersList({ developers = [] }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Developers Using Your Limit
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Developers with approved mentorship requests
          </p>
        </div>

        <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          {developers.length} active
        </span>
      </div>

      {developers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-5 py-10 text-center dark:border-gray-700">
          <p className="font-medium text-gray-700 dark:text-gray-200">
            No approved developers yet
          </p>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Approved mentorships will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {developers.map((developer, index) => {
            const name =
              developer.menteeName ||
              developer.name ||
              developer.menteeEmail?.split("@")[0] ||
              developer.studentEmail?.split("@")[0] ||
              "Developer";

            const email =
              developer.menteeEmail ||
              developer.studentEmail ||
              developer.email ||
              "";

            const approvalDate =
              developer.updatedAt || developer.createdAt;

            return (
              <div
                key={developer.id || developer._id || email || index}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900 dark:text-white">
                      {name}
                    </p>

                    <p className="break-all text-sm text-gray-500 dark:text-gray-400">
                      {email || "Email not available"}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 sm:text-right">
                  <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
                    Approved
                  </span>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Updated: {formatDate(approvalDate)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
