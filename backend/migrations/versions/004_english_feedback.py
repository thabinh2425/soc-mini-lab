"""Translate generated training feedback without changing analyst content or scores."""
from copy import deepcopy
from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None

TEXT = {
    "Chọn bằng chứng cốt lõi": "Select core evidence",
    "Ghi chú và timeline điều tra": "Investigation notes and timeline",
    "5 điểm cho ghi chú đã lưu, 5 điểm cho ít nhất một timeline analyst trong Incident Investigation.": "5 points for saved notes and 5 points for at least one analyst timeline event in Incident Investigation.",
    "Ghi kết luận điều tra": "Write an investigation conclusion",
    "5 điểm khi kết luận có ít nhất 20 ký tự. Chỉ đánh giá mức độ hoàn thành, không tự đánh giá ngữ nghĩa.": "5 points for a conclusion of at least 20 characters. This checks completion only, not semantic accuracy."
}
PREFIXES = {
    "Liên kết lần SSH thất bại với đăng nhập root thành công từ cùng nguồn. Log tham chiếu: ": "Correlate failed SSH attempts with a successful root login from the same source. Reference logs: ",
    "Kết hợp lệnh PowerShell mã hóa và thay đổi Defender exclusion. Log tham chiếu: ": "Correlate the encoded PowerShell command with the Defender exclusion change. Reference logs: ",
    "Đối chiếu các IP/cổng đích cùng nguồn để nhận diện quét ngang và dịch vụ được phép. Log tham chiếu: ": "Compare destination IPs and ports from the same source to identify horizontal scanning and allowed services. Reference logs: "
}


def translate_result(result, exact, prefixes):
    if not isinstance(result, dict):
        return
    for objective in result.get("objectives", []):
        # Only these rubric objectives contain application-generated Vietnamese.
        if objective.get("id") not in ("evidence", "documentation", "conclusion"):
            continue
        for key in ("title", "feedback"):
            value = objective.get(key)
            if not isinstance(value, str):
                continue
            if value in exact:
                objective[key] = exact[value]
            elif key == "feedback":
                for source, target in prefixes.items():
                    if value.startswith(source):
                        objective[key] = target + value[len(source):]
                        break


def rewrite(exact, prefixes):
    connection = op.get_bind()
    for name in ("attempts", "training_sessions"):
        table = sa.table(name, sa.column("id", sa.String), sa.column("data", sa.JSON))
        for row in connection.execute(sa.select(table.c.id, table.c.data)).mappings().all():
            data = deepcopy(row["data"])
            translate_result(data if name == "attempts" else data.get("result"), exact, prefixes)
            if data != row["data"]:
                connection.execute(table.update().where(table.c.id == row["id"]).values(data=data))


def upgrade():
    rewrite(TEXT, PREFIXES)


def downgrade():
    rewrite({value: key for key, value in TEXT.items()}, {value: key for key, value in PREFIXES.items()})

