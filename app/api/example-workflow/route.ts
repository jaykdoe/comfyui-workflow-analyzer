import { NextResponse } from "next/server"

export async function GET() {
  // Return the example workflow JSON
  // This would normally fetch from a file or database
  return NextResponse.json({
    last_node_id: 10,
    last_link_id: 15,
    nodes: [
      {
        id: 1,
        type: "LoadImage",
        pos: [100, 100],
        size: [200, 100],
        flags: {},
        order: 0,
        inputs: [],
        outputs: [
          {
            name: "IMAGE",
            type: "IMAGE",
            links: [1],
          },
        ],
        properties: {
          cnr_id: "comfy-core",
          ver: "0.3.15",
        },
        widgets_values: ["example_image.png", "image"],
      },
      {
        id: 2,
        type: "VAEDecode",
        pos: [400, 100],
        size: [200, 100],
        flags: {},
        order: 1,
        inputs: [
          {
            name: "samples",
            type: "LATENT",
            link: 2,
          },
          {
            name: "vae",
            type: "VAE",
            link: 3,
          },
        ],
        outputs: [
          {
            name: "IMAGE",
            type: "IMAGE",
            links: [4],
          },
        ],
        properties: {
          cnr_id: "comfy-core",
          ver: "0.3.15",
        },
      },
      {
        id: 3,
        type: "KSampler",
        pos: [700, 100],
        size: [200, 100],
        flags: {},
        order: 2,
        inputs: [
          {
            name: "model",
            type: "MODEL",
            link: 5,
          },
          {
            name: "positive",
            type: "CONDITIONING",
            link: 6,
          },
          {
            name: "negative",
            type: "CONDITIONING",
            link: 7,
          },
          {
            name: "latent_image",
            type: "LATENT",
            link: 8,
          },
        ],
        outputs: [
          {
            name: "LATENT",
            type: "LATENT",
            links: [2],
          },
        ],
        properties: {
          cnr_id: "comfy-core",
          ver: "0.3.15",
        },
        widgets_values: [123456789, "fixed", 20, 8, "euler", "normal", 1],
      },
    ],
    links: [
      [1, 1, 0, 2, 0, "IMAGE"],
      [2, 3, 0, 2, 0, "LATENT"],
      [3, 4, 0, 2, 1, "VAE"],
      [4, 2, 0, 5, 0, "IMAGE"],
    ],
  })
}
