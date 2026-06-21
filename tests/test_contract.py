"""CONTRACT 1 (ingestion) tests: good deposit+economics descriptors validate; ill-formed ones are rejected with a
reason; an impossible margin / a never-binding mill / a high discount rate is flagged; the committed example passes."""
from pathlib import Path

from cglab.io.contract import validate_deposit, validate_records
from cglab.io.formats import read_csv_rows


def _row(**over):
    base = {"deposit_id": "d", "grade_mean": 0.0075, "grade_cv": 0.6, "tonnage_mt": 400, "price": 9000,
            "mining_cost": 2.5, "processing_cost": 9.0, "refining_cost": 900, "fixed_cost_yr": 60, "recovery": 0.88,
            "mine_capacity": 45, "mill_capacity": 18, "market_capacity": 0.30, "discount_rate": 0.10}
    base.update(over)
    return base


def test_good_descriptor_accepted():
    rep = validate_records([_row()])
    assert rep.ok and len(rep.accepted) == 1 and not rep.rejected
    assert rep.accepted[0].price == 9000


def test_bad_descriptors_rejected_not_coerced():
    rows = [
        _row(price=0),                  # non-positive price
        _row(price=-1),                 # negative
        _row(recovery=1.5),             # recovery > 1
        _row(discount_rate=1.0),        # delta not in [0,1)
        _row(processing_cost="lots"),   # non-numeric
        _row(mine_capacity=0),          # zero capacity
        {"deposit_id": "m", "price": 9000},  # missing columns
    ]
    rep = validate_records(rows)
    assert len(rep.accepted) == 0 and len(rep.rejected) == len(rows)
    assert all("reason" in r for r in rep.rejected)


def test_impossible_and_extreme_flagged():
    rep = validate_records([_row(refining_cost=9000)])    # price - refining <= 0
    assert rep.ok and rep.flagged and "margin" in " ".join(rep.flagged[0]["flags"])
    rep2 = validate_records([_row(mill_capacity=50)])      # mill >= mine -> mill never binds
    assert rep2.ok and rep2.flagged and "mill" in " ".join(rep2.flagged[0]["flags"])
    rep3 = validate_records([_row(discount_rate=0.5)])     # high discount
    assert rep3.ok and rep3.flagged and "discount" in " ".join(rep3.flagged[0]["flags"])


def test_validate_deposit_gate():
    good = validate_deposit(_row())
    assert good.ok
    bad = validate_deposit(_row(price=0))
    assert not bad.ok and bad.rejected


def test_committed_example_passes_contract():
    csv = Path(__file__).resolve().parents[1] / "data" / "examples" / "deposits.csv"
    rep = validate_records(read_csv_rows(csv))
    assert rep.ok and not rep.rejected, f"deposits.csv should pass Contract 1: {rep.summary()}"
