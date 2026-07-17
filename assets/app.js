const $ = (selector) => document.querySelector(selector);

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );

async function get(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`${path}: ${response.status}`);
  }

  return response.json();
}

const query = new URLSearchParams(location.search);
const tripId = query.get("trip");

function renderButtons(items) {
  return `
    <div class="btns">
      ${items
        .map(
          (item) => `
            <a
              class="btn"
              target="_blank"
              rel="noopener"
              href="${esc(item.url)}"
            >
              ${esc(item.label)}
            </a>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderHome(catalog) {
  document.title = catalog.site.title;

  $("#app").innerHTML = `
    <header class="hero">
      <div class="wrap">
        <div class="eyebrow">Family Travel System</div>
        <h1>${esc(catalog.site.title)}</h1>
        <div class="subtitle">${esc(catalog.site.subtitle)}</div>
      </div>
    </header>

    <main>
      <div class="wrap">
        <div class="catalog">
          ${catalog.trips
            .map(
              (trip) => `
                <a class="trip-card card" href="?trip=${encodeURIComponent(trip.id)}">
                  <div class="eyebrow catalog-status">${esc(trip.status)}</div>
                  <h2>${esc(trip.title)}</h2>
                  <p>${esc(trip.summary)}</p>
                  <div class="small">${esc(trip.dates)}</div>
                </a>
              `,
            )
            .join("")}
        </div>

        <div class="footer">
          TravelOS · 数据与页面模板分离。新增旅行主要通过新增 trip.json 完成。
        </div>
      </div>
    </main>
  `;
}

function renderDay(day) {
  return `
    <section class="day">
      <div class="dayhead">
        <div class="badge d${day.number}">D${day.number}</div>
        <div class="daytitle">
          <h2>${esc(day.date)}｜${esc(day.title)}</h2>
          <p>${esc(day.theme)}</p>
        </div>
      </div>

      <div class="tablewrap">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>地点 / 路段</th>
              <th>里程</th>
              <th>驾驶</th>
              <th>电量</th>
              <th>安排</th>
            </tr>
          </thead>
          <tbody>
            ${day.items
              .map(
                (item) => `
                  <tr>
                    ${item
                      .map(
                        (value, index) => `
                          <td class="${index === 2 ? "miles" : index === 4 ? "soc" : ""}">
                            ${esc(value)}
                          </td>
                        `,
                      )
                      .join("")}
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <div class="route-summary">
        ${day.summary
          .map(
            (summary) => `
              <div>
                <b>${esc(summary[0])}</b>
                ${esc(summary[1])}
              </div>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

async function renderTrip(id) {
  const [trip, vehicles, lodging] = await Promise.all([
    get(`trips/${id}/trip.json`),
    get("data/entities/vehicles.json"),
    get("data/entities/lodging.json"),
  ]);

  const vehicle = vehicles[trip.vehicleId];
  const hotel = lodging[trip.lodgingId];

  document.title = `${trip.title}｜TravelOS`;

  $("#app").innerHTML = `
    <header class="hero">
      <div class="wrap">
        <div class="eyebrow">${esc(trip.kicker)}</div>
        <h1>
          ${esc(trip.title)}
          <br>
          ${esc(trip.subtitle)}
        </h1>
        <div class="subtitle">
          ${esc(trip.dates)}。${esc(trip.summary)}
        </div>
        <div class="meta">
          <span class="chip">出发：${esc(trip.origin)}</span>
          <span class="chip">住宿：${esc(hotel.name)} × ${esc(hotel.nights)}晚</span>
          <span class="chip">车辆：${esc(vehicle.name)}</span>
          <span class="chip">宝宝${esc(trip.baby)}</span>
        </div>
      </div>
    </header>

    <main>
      <div class="wrap">
        ${trip.constraints
          .map(
            (constraint, index) => `
              <div class="notice ${index ? "ev" : ""}">
                <strong>${index ? "电车关键约束" : "安排结论"}：</strong>
                ${esc(constraint)}
              </div>
            `,
          )
          .join("")}

        <section class="grid2">
          <div class="card">
            <h2>整体策略</h2>
            <p>${esc(vehicle.strategy)} ${esc(hotel.notes)}</p>

            <div class="stats">
              ${trip.stats
                .map(
                  (stat) => `
                    <div class="stat">
                      <b>${esc(stat[0])}</b>
                      <span class="small">${esc(stat[1])}</span>
                    </div>
                  `,
                )
                .join("")}
            </div>

            <div class="callout">
              <strong>执行阈值：</strong>${esc(trip.threshold)}
            </div>
          </div>

          <div class="card">
            <h2>路线链接</h2>
            <p>山区信号不稳定，建议出发前下载离线地图，并在车机中逐段导航。</p>
            ${renderButtons(trip.maps)}
          </div>
        </section>

        ${trip.days.map(renderDay).join("")}

        <section class="grid2 section-spaced">
          <div class="card">
            <h2>出发前清单</h2>
            <ul>
              ${trip.checklist.map((item) => `<li>${esc(item)}</li>`).join("")}
            </ul>
          </div>

          <div class="card">
            <h2>数据结构</h2>
            <p>
              本页由旅行数据、车辆资料和住宿资料动态组合生成，而不是把行程写死在 HTML 中。
            </p>
            <div class="btns">
              <a class="btn" href="./">返回 TravelOS</a>
              <a
                class="btn ev"
                href="trips/${esc(id)}/trip.json"
                target="_blank"
                rel="noopener"
              >
                查看 Trip JSON
              </a>
            </div>
          </div>
        </section>

        <div class="footer">
          TravelOS · 行程数据版本：${esc(trip.dates)}。实际道路、天气、充电与园区规则以出发时官方信息及车机为准。
        </div>
      </div>
    </main>
  `;
}

(async () => {
  try {
    if (tripId) {
      await renderTrip(tripId);
    } else {
      renderHome(await get("data/catalog.json"));
    }
  } catch (error) {
    $("#app").innerHTML = `
      <div class="error">
        <h2>页面加载失败</h2>
        <p>${esc(error.message)}</p>
        <p>请通过 GitHub Pages 地址访问，不要直接打开本地文件。</p>
      </div>
    `;
  }
})();
