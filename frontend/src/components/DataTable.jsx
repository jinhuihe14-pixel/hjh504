import { useState, useMemo } from 'react'
import './DataTable.css'

function DataTable({
  columns,
  data,
  loading = false,
  pagination = true,
  pageSize = 10,
  rowKey = 'id',
  striped = true,
  emptyText = '暂无数据',
  rowClassName,
}) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = useMemo(() => {
    if (!data || data.length === 0) return 1
    return Math.ceil(data.length / pageSize)
  }, [data, pageSize])

  const paginatedData = useMemo(() => {
    if (!pagination) return data || []
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return (data || []).slice(start, end)
  }, [data, currentPage, pageSize, pagination])

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const renderCell = (column, row, rowIndex) => {
    if (column.render) {
      return column.render(row[column.key], row, rowIndex)
    }
    return row[column.key]
  }

  const renderPagination = () => {
    if (!pagination || !data || data.length === 0) return null

    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return (
      <div className="pagination">
        <span className="pagination-info">
          共 {data.length} 条，第 {currentPage}/{totalPages} 页
        </span>
        <div className="pagination-buttons">
          <button
            className="page-btn"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            首页
          </button>
          <button
            className="page-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            上一页
          </button>
          {pages.map((page) => (
            <button
              key={page}
              className={`page-btn ${page === currentPage ? 'active' : ''}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}
          <button
            className="page-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            下一页
          </button>
          <button
            className="page-btn"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            末页
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="data-table-container">
        <div className="table-loading">
          <div className="loading-spinner" />
          <span>加载中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="data-table-container">
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{ width: column.width, textAlign: column.align || 'left' }}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => {
                const baseClass = striped && rowIndex % 2 === 1 ? 'striped' : '';
                const customClass = rowClassName ? rowClassName(row, rowIndex) : '';
                return (
                <tr
                  key={row[rowKey] || rowIndex}
                  className={`${baseClass} ${customClass}`.trim()}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      style={{ textAlign: column.align || 'left' }}
                    >
                      {renderCell(column, row, rowIndex)}
                    </td>
                  ))}
                </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length} className="empty-cell">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  )
}

export default DataTable
