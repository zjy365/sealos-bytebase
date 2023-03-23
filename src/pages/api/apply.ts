import { generateByteBaseTemplate, ByteBaseStatus } from '@/interfaces/bytebase'
import { authSession } from '@/service/auth'
import {
  ApplyYaml,
  CRDMeta,
  GetCRD,
  GetUserDefaultNameSpace,
  K8sApi,
} from '@/service/kubernetes'
import { jsonRes } from '@/service/response'
import type { NextApiRequest, NextApiResponse } from 'next'

export const ByteBase_meta: CRDMeta = {
  group: 'ByteBase.sealos.io',
  version: 'v1',
  namespace: 'ByteBase-app',
  plural: 'ByteBases',
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const kubeconfig = await authSession(req.headers)
    const kc = K8sApi(kubeconfig)

    const kube_user = kc.getCurrentUser()

    if (!kube_user || !kube_user.token || !kube_user.name) {
      throw new Error('kube_user get failed')
    }

    const byteBase_name = 'bytebase-' + kube_user.name
    const namespace = GetUserDefaultNameSpace(kube_user.name)

    // first get user namespace crd
    let byteBase_meta_user = { ...ByteBase_meta }
    byteBase_meta_user.namespace = namespace

    try {
      // get crd
      const ByteBaseUserDesc = await GetCRD(
        kc,
        byteBase_meta_user,
        byteBase_name
      )
      console.log(ByteBaseUserDesc)

      if (ByteBaseUserDesc?.body?.status) {
        const ByteBaseStatus = ByteBaseUserDesc.body.status as ByteBaseStatus
        if (ByteBaseStatus.availableReplicas > 0) {
          // temporarily add domain scheme
          let domain = ByteBaseStatus.domain || ''
          if (!domain.startsWith('https://')) {
            domain = 'https://' + domain
          }
          return jsonRes(res, { data: domain })
        }
      }
    } catch (error) {
      // console.log(error)
    }

    const ByteBase_yaml = generateByteBaseTemplate({
      namespace: namespace,
      bytebase_name: byteBase_name,
    })
    const result = await ApplyYaml(kc, ByteBase_yaml)
    jsonRes(res, { code: 201, data: result, message: '' })
  } catch (error) {
    // console.log(error)
    jsonRes(res, { code: 500, error })
  }
}
