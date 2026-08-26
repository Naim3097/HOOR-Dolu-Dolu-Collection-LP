import { OCCASIONS } from "@/lib/products";
import { Video } from "@/components/hoor/video";

export function Occasions() {
  return (
    <section className="occ" id="occasions">
      <div className="wrap">
        <div className="sect-head rv">
          <span className="label">One dress, every occasion</span>
          <h2>You will not buy this for one day of the year.</h2>
          <p className="sub">Long sleeve, full length, no zips and no fitting. It moves between a Monday desk and a Saturday kenduri without a change of plan.</p>
        </div>
        <div className="occ__grid">
          <Video name="renda_camel" caption="RENDA in Camel Gold — campaign film" className="occ__video rv" />
          <ol className="occ__list rv rv-d1">
            {OCCASIONS.map((o, i) => <li key={o.label}><span className="n">{String(i + 1).padStart(2, "0")}</span><div><h3>{o.label}</h3><p>{o.note}</p></div></li>)}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function Fabric() {
  return (
    <section className="fabric">
      <div className="wrap">
        <div className="fabric__grid">
          <div>
            <div className="sect-head rv" style={{ marginBottom: 0 }}><span className="label">The cloth</span><h2>Made for 33°C and a full day.</h2></div>
            <div className="fabric__points rv rv-d1">
              <div><h3>Lightweight &amp; flowy</h3><p>It hangs from the shoulder and moves away from the body. No cling, no static, no clammy afternoon.</p></div>
              <div><h3>All-day comfy</h3><p>Nothing fastens, nothing digs. Sit through a long lunch and stand up without needing a mirror.</p></div>
              <div><h3>Pockets, properly</h3><p>Side seam pockets set into the A-line, deep enough for a phone and invisible when empty.</p></div>
            </div>
          </div>
          <Video name="senja_midnight" start={6.5} caption="SENJA in Midnight, fabric in motion" className="fabric__video rv rv-d2" />
        </div>
      </div>
    </section>
  );
}
