/* global Chart, ApiClient */

(function () {
  const charts = {};

  function destroyCharts() {
    Object.keys(charts).forEach(function (key) {
      if (charts[key]) {
        charts[key].destroy();
        charts[key] = null;
      }
    });
  }

  function fmtInt(n) {
    if (n === null || n === undefined || isNaN(n)) {
      return "—";
    }
    return String(Math.round(Number(n)));
  }

  function fmtMoney(n) {
    if (n === null || n === undefined || isNaN(n)) {
      return "—";
    }
    return Number(n).toFixed(2) + " €";
  }

  function topCategoriesWithOther(rows, maxSlices) {
    const lim = maxSlices || 8;
    if (!rows || !rows.length) {
      return { labels: [], values: [] };
    }
    const sorted = rows.slice().sort(function (a, b) {
      return (b.n || 0) - (a.n || 0);
    });
    const head = sorted.slice(0, lim);
    const tail = sorted.slice(lim);
    const otros = tail.reduce(function (acc, r) {
      return acc + (r.n || 0);
    }, 0);
    const labels = head.map(function (r) {
      return r.etiqueta;
    });
    const values = head.map(function (r) {
      return r.n || 0;
    });
    if (otros > 0) {
      labels.push("Otros");
      values.push(otros);
    }
    return { labels: labels, values: values };
  }

  window.initGraficos = async function initGraficos() {
    const loading = document.getElementById("graficos-loading");
    const errBox = document.getElementById("graficos-error");
    const content = document.getElementById("graficos-content");

    if (loading) {
      loading.style.display = "";
    }
    if (errBox) {
      errBox.style.display = "none";
    }
    if (content) {
      content.style.display = "none";
    }

    destroyCharts();

    try {
      const data = await ApiClient.get("/api/stats/catalog");

      const k = data.kpis || {};
      const elP = document.getElementById("kpi-productos");
      const elPr = document.getElementById("kpi-precios");
      const elS = document.getElementById("kpi-supers");
      const elSin = document.getElementById("kpi-sin-precio");
      if (elP) {
        elP.textContent = fmtInt(k.productos);
      }
      if (elPr) {
        elPr.textContent = fmtInt(k.precios_registrados);
      }
      if (elS) {
        elS.textContent = fmtInt(k.supermercados);
      }
      if (elSin) {
        elSin.textContent = fmtInt(k.sin_precio);
      }

      const palette = [
        "#4c6ef5",
        "#15aabf",
        "#40c057",
        "#fab005",
        "#fd7e14",
        "#e64980",
        "#7950f2",
        "#868e96",
        "#339af0",
        "#82c91e"
      ];

      const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { boxWidth: 12, font: { size: 11 } }
          }
        }
      };

      const cat = topCategoriesWithOther(data.por_categoria || [], 8);
      const ctxCat = document.getElementById("chart-categorias");
      if (ctxCat && cat.labels.length) {
        charts.categorias = new Chart(ctxCat, {
          type: "doughnut",
          data: {
            labels: cat.labels,
            datasets: [
              {
                data: cat.values,
                backgroundColor: palette
              }
            ]
          },
          options: commonOptions
        });
      }

      const cov = data.cobertura_supermercado || [];
      const ctxSup = document.getElementById("chart-supermercados");
      if (ctxSup && cov.length) {
        charts.supermercados = new Chart(ctxSup, {
          type: "bar",
          data: {
            labels: cov.map(function (r) {
              return r.etiqueta;
            }),
            datasets: [
              {
                label: "Productos con precio",
                data: cov.map(function (r) {
                  return r.n;
                }),
                backgroundColor: palette[0]
              }
            ]
          },
          options: {
            ...commonOptions,
            scales: {
              x: { ticks: { maxRotation: 45, minRotation: 0 } },
              y: { beginAtZero: true }
            },
            plugins: { ...commonOptions.plugins, legend: { display: false } }
          }
        });
      }

      const rang = (data.rangos_precio || []).filter(function (r) {
        return (r.n || 0) > 0;
      });
      const ctxR = document.getElementById("chart-rangos");
      if (ctxR && rang.length) {
        charts.rangos = new Chart(ctxR, {
          type: "doughnut",
          data: {
            labels: rang.map(function (r) {
              return r.etiqueta;
            }),
            datasets: [
              {
                data: rang.map(function (r) {
                  return r.n;
                }),
                backgroundColor: palette
              }
            ]
          },
          options: commonOptions
        });
      }

      const med = (data.precio_medio_super || []).filter(function (r) {
        return r.media !== null && r.media !== undefined && !isNaN(r.media);
      });
      const ctxM = document.getElementById("chart-precio-medio");
      if (ctxM && med.length) {
        charts.medio = new Chart(ctxM, {
          type: "bar",
          data: {
            labels: med.map(function (r) {
              return r.etiqueta;
            }),
            datasets: [
              {
                label: "Precio medio (€)",
                data: med.map(function (r) {
                  return Number(r.media.toFixed(2));
                }),
                backgroundColor: palette[2]
              }
            ]
          },
          options: {
            ...commonOptions,
            scales: {
              x: { ticks: { maxRotation: 45, minRotation: 0 } },
              y: { beginAtZero: true }
            },
            plugins: { ...commonOptions.plugins, legend: { display: false } }
          }
        });
      }

      const baratos = data.top_baratos || [];
      const ctxB = document.getElementById("chart-baratos");
      if (ctxB && baratos.length) {
        charts.baratos = new Chart(ctxB, {
          type: "bar",
          data: {
            labels: baratos.map(function (r) {
              return r.etiqueta;
            }),
            datasets: [
              {
                label: "Precio mínimo (€)",
                data: baratos.map(function (r) {
                  return r.min_precio !== null ? Number(r.min_precio) : 0;
                }),
                backgroundColor: palette[4]
              }
            ]
          },
          options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function (ctx) {
                    return fmtMoney(ctx.raw);
                  }
                }
              }
            },
            scales: {
              x: { beginAtZero: true },
              y: { ticks: { font: { size: 10 } } }
            }
          }
        });
      }

      const subs = data.top_subcategorias || [];
      const ctxSub = document.getElementById("chart-subcats");
      if (ctxSub && subs.length) {
        charts.subcats = new Chart(ctxSub, {
          type: "bar",
          data: {
            labels: subs.map(function (r) {
              return r.etiqueta;
            }),
            datasets: [
              {
                label: "Productos",
                data: subs.map(function (r) {
                  return r.n;
                }),
                backgroundColor: palette[5]
              }
            ]
          },
          options: {
            ...commonOptions,
            scales: {
              x: { ticks: { maxRotation: 45, minRotation: 0 } },
              y: { beginAtZero: true }
            },
            plugins: { ...commonOptions.plugins, legend: { display: false } }
          }
        });
      }

      if (loading) {
        loading.style.display = "none";
      }
      if (content) {
        content.style.display = "";
      }
    } catch (e) {
      console.error(e);
      if (loading) {
        loading.style.display = "none";
      }
      if (errBox) {
        errBox.style.display = "";
      }
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("graficos-content")) {
      window.initGraficos();
    }
  });
})();
