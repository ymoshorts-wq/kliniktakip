const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY as string | undefined

interface ImgbbUploadResponse {
  success: boolean
  status: number
  data: {
    id: string
    url: string
    display_url?: string
  }
}

export async function uploadImageToImgur(file: File): Promise<{ id: string; link: string }> {
  // Not: Fonksiyon adı geriye dönük olarak korunuyor, ama artık IMGBB kullanıyor.
  if (!IMGBB_API_KEY) {
    throw new Error('IMGBB API anahtarı (VITE_IMGBB_API_KEY) tanımlı değil.')
  }

  const formData = new FormData()
  formData.append('key', IMGBB_API_KEY)
  formData.append('image', file)

  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData,
  })

  const json = (await response.json()) as ImgbbUploadResponse

  if (!json.success || !json.data?.id || !json.data?.url) {
    throw new Error('IMGBB yüklemesi başarısız oldu.')
  }

  return {
    id: json.data.id,
    link: json.data.url,
  }
}
