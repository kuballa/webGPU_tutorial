// script.js

async function main() {
  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice();
  if (!device) {
    fail('Your browser does not support WebGPU');
    return;
  }

  // Select the canvas by its ID
  const canvas = document.getElementById('webgpuCanvas');
  const context = canvas.getContext('webgpu');
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: presentationFormat,
  });

  const module = device.createShaderModule({
    label: 'Hardcoded red triangle shaders',
    code: `
      @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
      ) -> @builtin(position) vec4f {
        let pos = array(
          vec2f( 0.0,  0.5),  // Top-center
          vec2f(-0.5, -0.5),  // Bottom-left
          vec2f( 0.5, -0.5)   // Bottom-right
        );
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }

      @fragment fn fs() -> @location(0) vec4f {
        return vec4f(1, 0, 0, 1); // Red color
      }
    `,
  });

  const pipeline = device.createRenderPipeline({
    label: 'Render pipeline for red triangle',
    layout: 'auto',
    vertex: {
      module,
    },
    fragment: {
      module,
      targets: [{ format: presentationFormat }],
    },
  });

  const renderPassDescriptor = {
    label: 'Basic canvas renderPass',
    colorAttachments: [
      {
        clearValue: [0.3, 0.3, 0.3, 1], // Dark gray background
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
  };

  function render() {
    renderPassDescriptor.colorAttachments[0].view =
      context.getCurrentTexture().createView();

    const encoder = device.createCommandEncoder({ label: 'Command Encoder' });
    const pass = encoder.beginRenderPass(renderPassDescriptor);
    pass.setPipeline(pipeline);
    pass.draw(3); // Draw the triangle
    pass.end();

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
  }

  render();
}

function fail(message) {
  alert(message);
}

main();
