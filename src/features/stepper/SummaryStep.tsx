import { cutListFileName, toCsv, toCutList } from '../../domain/cutlist'
import { useDerived } from '../../state/useConfigurator'
import { downloadText } from '../../ui/download'
import { formatPln, pluralPl } from '../../ui/format'
import { CopyLinkButton } from '../share/CopyLinkButton'
import { summaryGroups } from '../summary/summary'

export function SummaryStep() {
  const { config, panels, price } = useDerived()
  const rows = toCutList(panels)
  const pieces = rows.reduce((sum, row) => sum + row.qty, 0)

  const download = () =>
    downloadText(cutListFileName(config), toCsv(rows), 'text/csv;charset=utf-8')

  return (
    <>
      {summaryGroups(config).map((group) => (
        <section className="step-group" key={group.title}>
          <h3 className="step-group-title">{group.title}</h3>
          <dl className="summary-list">
            {group.rows.map((row) => (
              <div className="summary-row" key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <section className="step-group">
        <h3 className="step-group-title">Lista formatek</h3>
        <p className="field-hint step-group-note">
          {pieces} {pluralPl(pieces, ['formatka', 'formatki', 'formatek'])} z płyty. Wymiary w mm:
          długość × szerokość × grubość.
        </p>
        <div className="cutlist-scroll">
          <table className="cutlist">
            <thead>
              <tr>
                <th scope="col">Formatka</th>
                <th scope="col">Wymiary</th>
                <th scope="col">Szt.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.name}-${row.length}-${row.width}-${row.notes}`}>
                  <th scope="row">
                    {row.name}
                    <span className="cutlist-meta">
                      {row.edges ? `${row.decor}, okleina ${row.edges}` : row.decor}
                    </span>
                  </th>
                  <td>
                    {row.length} × {row.width} × {row.thickness}
                  </td>
                  <td>{row.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="step-group summary-actions">
        <p className="summary-total">
          Razem <strong>{formatPln(price.total)}</strong>
        </p>
        <button type="button" className="button-primary" onClick={download}>
          Pobierz listę formatek (CSV)
        </button>
        <CopyLinkButton />
      </section>
    </>
  )
}
