import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useTable, useFilters, useSortBy, useExpanded } from "react-table";

const Styles = styled.div`
  padding: 1rem;
  position: relative;

  table {
    border-spacing: 0;
    font-family: Helvetica, Arial, sans-serif;
    box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
      0 1px 1px 0 rgba(0, 0, 0, 0.14), 0 1px 3px 0 rgba(0, 0, 0, 0.12);

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
      :hover {
        background-color: rgb(220, 220, 220);
      }
    }
    .tableCell {
      padding: 12px;
      font-size: 0.875rem;
      text-align: left;
      font-weight: 400;
      line-height: 1.2;
      border-bottom: 1px solid rgba(224, 224, 224, 1);
      letter-spacing: 0.01071em;
      vertical-align: inherit;
      color: rgba(0, 0, 0, 0.87);
    }
    th.head {
      font-weight: 600;
      line-height: 1.5rem;
      top: 0;
      left: 0;
      z-index: 2;
      position: sticky;
      background-color: white;
    }
  }
`;

// default UI for filtering
function DefaultColumnFilter({
  column: { filterValue, preFilteredRows, setFilter }
}) {
  const count = preFilteredRows.length;

  return (
    <input
      value={filterValue || ""}
      onChange={e => {
        setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
      }}
      onClick={e => e.stopPropagation()}
      placeholder={`Search ${count} records...`}
    />
  );
}

const defaultPropGetter = () => ({});

function Table({
  columns,
  data,
  getCellProps = defaultPropGetter,
  renderRowSubComponent
}) {
  const defaultColumn = React.useMemo(
    () => ({
      Filter: DefaultColumnFilter
    }),
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    flatColumns
  } = useTable(
    {
      columns,
      data,
      defaultColumn
    },
    useFilters,
    useSortBy,
    useExpanded
  );

  // Render the UI for your table
  return (
    <table {...getTableProps()}>
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th
                className="tableCell head"
                {...column.getHeaderProps(column.getSortByToggleProps())}
              >
                {column.render("Header")}
                <span>
                  {column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}
                </span>
                <div>{column.canFilter ? column.render("Filter") : null}</div>
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row, i) => {
          prepareRow(row);
          return (
            <React.Fragment {...row.getRowProps()}>
              <tr>
                {row.cells.map(cell => {
                  return (
                    <td
                      className="tableCell"
                      {...cell.getCellProps([getCellProps(cell)])}
                    >
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
              {row.isExpanded ? (
                <tr>
                  <td colSpan={flatColumns.length}>
                    {renderRowSubComponent({ row })}
                  </td>
                </tr>
              ) : null}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

export default function App() {
  let [data, setData] = useState({ events: [] });
  //fetch data from Event API
  useEffect(() => {
    async function fetchEventsData() {
      const result = await fetch(
        "https://eonet.sci.gsfc.nasa.gov/api/v3-beta/events?limit=50&amp;days=365"
      );
      const evntData = await result.json();
      const edata = evntData.events;
      setData(edata);
    }
    fetchEventsData();
  }, []);

  const columns = React.useMemo(
    () => [
      {
        // Make an expander cell
        Header: () => null, // No header
        id: "expander",
        Cell: ({ row }) => (
          <span {...row.getExpandedToggleProps()}>
            {row.isExpanded ? "👇" : "👉"}
          </span>
        )
      },
      {
        Header: "Events Id",
        accessor: "id",
        disableSortBy: true,
        disableFilters: true
      },
      {
        Header: "Title",
        accessor: "title",
        disableFilters: true
      },
      {
        Header: "Status",
        accessor: data => (data.closed ? data.closed : "open")
      },
      {
        Header: "Categories",
        accessor: data => data.categories[0].title
      },
      {
        Header: "Date",
        accessor: data => new Date(data.geometry[0].date).toDateString(),
        sortType: (rowA, rowB, columnId) => {
          const dateA = new Date(rowA.values[columnId]).getTime();
          const dateB = new Date(rowB.values[columnId]).getTime();

          return dateA === dateB ? 0 : dateA > dateB ? 1 : -1;
        }
      },
      {
        Header: "Link",
        accessor: "link",
        disableSortBy: true,
        disableFilters: true
      }
    ],
    []
  );

  const renderRowSubComponent = React.useCallback(
    ({ row }) => {
      const currentRowIndex = row["id"];
      const currentRowData = currentRowIndex && data[currentRowIndex];
      return (
        <pre
          style={{
            fontSize: "15px"
          }}
        >
          <code>{JSON.stringify({ values: currentRowData }, null, 2)}</code>
        </pre>
      );
    },
    [data]
  );

  return data && data.length > 0 ? (
    <Styles>
      <Table
        columns={columns}
        data={data}
        renderRowSubComponent={renderRowSubComponent}
        getCellProps={cellInfo => ({
          style: {
            color: `${cellInfo.value === "open" ? "#14ca14" : ""}`,
            fontWeight: `${cellInfo.value === "open" ? "600" : ""}`
          }
        })}
      />
    </Styles>
  ) : (
    <div className="loader">Loader..</div>
  );
}
