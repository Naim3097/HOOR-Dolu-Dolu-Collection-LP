import { OCCASIONS } from "@/lib/products";
import { Video } from "@/components/hoor/video";

export function Occasions() {
  return (
    <section className="occ" id="occasions">
      <div className="wrap">
        <div className="sect-head rv">
          <span className="label">One dress, every occasion</span>
          <h2>365 days of comfort. 365 days of HOOR. Kecantikan 360°.</h2>
          <p className="sub">Because your favourite dress should be styled every day. Look pretty, feel pretty, in 360° view.</p>
        </div>
        <div className="occ__grid">
          <Video name="renda_camel" caption="Batik Dolu-Dolu, the campaign film" className="occ__video rv" />
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
            <div className="sect-head rv" style={{ marginBottom: 0 }}><span className="label">The fabric</span><h2>Made for 33°C Malaysian weather.</h2></div>
            <div className="fabric__points rv rv-d1">
              <div><h3>Cotton silk, all day</h3><p>Lightweight, breathable and soft on the skin. It keeps you cool and comfortable from morning to night.</p></div>
              <div><h3>Flatters every figure</h3><p>The A-Cutline Dress falls just nicely, looking like it was custom-made for your body.</p></div>
              <div><h3>Kind to pear-shaped bodies</h3><p>Neat at the shoulder, generous through the hip. It balances a pear body shape without clinging to your body.</p></div>
              <div><h3>Opaque, no inner needed</h3><p>The cotton silk is fully opaque on its own. No lining, no extra layer underneath.</p></div>
              <div><h3>Pockets on both sides</h3><p>Side seam pockets deep enough for your phone, keys and a small purse.</p></div>
            </div>
          </div>
          <Video name="senja_midnight" start={6.5} caption="DILLA · SENJA in Black Batik, fabric in motion" className="fabric__video rv rv-d2" />
        </div>
      </div>
    </section>
  );
}
