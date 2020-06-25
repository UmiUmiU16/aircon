import React from 'react'
import {Card, Cascader, Tooltip, Icon, Form, Checkbox, Select, Input, Button, Col, Row, message, BackTop} from 'antd'
import CustomBreadcrumb from '../../../components/CustomBreadcrumb/index'

const FormItem = Form.Item
const Option = Select.Option

@Form.create()
class FormDemo1 extends React.Component {
  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (err) {
        message.warning('请先填写正确的表单')
      } else {
        message.success('提交成功')
        // console.log(values)
      }
    });
  }

  render() {
    const {getFieldDecorator} = this.props.form
    const formItemLayout = {
      labelCol: {
        xs: {span: 24},
        sm: {span: 4},
      },
      wrapperCol: {
        xs: {span: 24},
        sm: {span: 12},
      },
    };
    const tailFormItemLayout = {
      wrapperCol: {
        xs: {
          span: 24,
          offset: 0,
        },
        sm: {
          span: 12,
          offset: 4,
        },
      },
    }
    
    return (
      <div>
        <CustomBreadcrumb arr={['房间信息', '查找房间号']}/>
        <Card bordered={false} title='查找房间号'>
          <Form layout='horizontal' style={{width: '70%', margin: '0 auto'}} onSubmit={this.handleSubmit}>
            <FormItem label='住户名' {...formItemLayout}>
              {
                getFieldDecorator('temperature', {
                  rules: [
                    {
                      required: true,
                      message: '请输入正确的名称'
                    }
                  ]
                })(
                  <Input/>
                )
              }
            </FormItem>
            <FormItem style={{textAlign: 'center'}} {...tailFormItemLayout}>
              <Button type="primary" htmlType="submit" disabled={false}>提交</Button>
            </FormItem>
          </Form>
        </Card>
        <BackTop visibilityHeight={200} style={{right: 50}}/>
      </div>
    )
  }
}

export default FormDemo1