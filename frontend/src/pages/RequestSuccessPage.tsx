import { Button, Card, Result } from "antd";
import { Link } from "react-router-dom";

export function RequestSuccessPage() {
  return (
    <Card className="success-card content-card--elevated">
      <Result
        status="success"
        title="需求已提交成功"
        subTitle="感谢你的反馈。我们会先做信息核验，再安排资源补充；如果留下了联系方式，会在有结果后通知你。"
        extra={
          <Button type="primary">
            <Link to="/">返回资源首页</Link>
          </Button>
        }
      />
    </Card>
  );
}
